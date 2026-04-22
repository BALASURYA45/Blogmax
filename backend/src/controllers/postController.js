const Post = require('../models/Post');
const User = require('../models/User');
const Category = require('../models/Category');
const PostRevision = require('../models/PostRevision');
const crypto = require('crypto');
const { createNotification } = require('./notificationController');

const MAX_REVISIONS_PER_POST = 50;
const MIN_SECONDS_BETWEEN_REV_SNAPSHOTS = 20;

const computeSnapshotHash = (postLike) => {
  const normalized = {
    title: postLike.title || '',
    content: postLike.content || '',
    excerpt: postLike.excerpt || '',
    category: (postLike.category && postLike.category._id ? postLike.category._id : postLike.category) || '',
    tags: Array.isArray(postLike.tags) ? postLike.tags : [],
    featuredImage: postLike.featuredImage || '',
    scheduledAt: postLike.scheduledAt ? new Date(postLike.scheduledAt).toISOString() : '',
    status: postLike.status || 'draft'
  };
  return crypto.createHash('sha1').update(JSON.stringify(normalized)).digest('hex');
};

const canEditPost = (user, post) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return post.author.toString() === user._id.toString();
};

const createRevisionSnapshot = async ({ post, userId, reason }) => {
  const snapshotHash = computeSnapshotHash(post);

  const latest = await PostRevision.findOne({ post: post._id }).sort({ createdAt: -1 }).lean();
  if (latest) {
    const secondsSince = (Date.now() - new Date(latest.createdAt).getTime()) / 1000;
    if (latest.snapshotHash === snapshotHash && secondsSince < MIN_SECONDS_BETWEEN_REV_SNAPSHOTS) {
      return null;
    }
  }

  const rev = await PostRevision.create({
    post: post._id,
    author: userId,
    reason,
    snapshotHash,
    title: post.title,
    content: post.content,
    excerpt: post.excerpt || '',
    category: post.category,
    tags: post.tags || [],
    featuredImage: post.featuredImage || '',
    scheduledAt: post.scheduledAt || null,
    status: post.status || 'draft'
  });

  const count = await PostRevision.countDocuments({ post: post._id });
  if (count > MAX_REVISIONS_PER_POST) {
    const extra = count - MAX_REVISIONS_PER_POST;
    const toDelete = await PostRevision.find({ post: post._id })
      .sort({ createdAt: 1 })
      .limit(extra)
      .select('_id')
      .lean();
    if (toDelete.length > 0) {
      await PostRevision.deleteMany({ _id: { $in: toDelete.map(d => d._id) } });
    }
  }

  return rev;
};

const computeTrendingScore = (post, nowMs) => {
  const views = post.views || 0;
  const likesCount = post.likes?.length || 0;
  const createdAtMs = new Date(post.publishedAt || post.createdAt).getTime();
  const hoursSince = Math.max(0, (nowMs - createdAtMs) / (1000 * 60 * 60));

  // Engagement with time decay (tunable, simple, fast).
  const engagement = views + likesCount * 8;
  return (engagement + 25) / Math.pow(hoursSince + 2, 1.25);
};

const createPost = async (req, res) => {
  try {
    const { title, content, category, tags, status, excerpt, featuredImage } = req.body;
    const { scheduledAt } = req.body;
    const slug = title.toLowerCase().split(' ').join('-') + '-' + Date.now();
    
    let categoryId = category;

    // Check if category is a valid ObjectId
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(category)) {
      // It's likely a fallback string (e.g., 'education')
      let cat = await Category.findOne({ name: new RegExp('^' + category + '$', 'i') });
      if (!cat) {
        cat = new Category({ 
          name: category.charAt(0).toUpperCase() + category.slice(1), 
          slug: category.toLowerCase() 
        });
        await cat.save();
      }
      categoryId = cat._id;
    }
    
    const post = new Post({
      title,
      content,
      slug,
      author: req.user._id,
      category: categoryId,
      tags,
      status,
      excerpt,
      featuredImage,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      publishedAt: status === 'published' ? new Date() : null
    });

    await post.save();

    // Seed first revision snapshot (initial state) for version history on first edit.
    await createRevisionSnapshot({ post, userId: req.user._id, reason: 'manual' });

    // Notify followers if published immediately
    if (status === 'published' && !scheduledAt) {
      const user = await User.findById(req.user._id);
      if (user && user.followers.length > 0) {
        const io = req.app.get('io');
        user.followers.forEach(followerId => {
          createNotification(io, {
            recipient: followerId,
            sender: req.user._id,
            type: 'post',
            post: post._id
          });
        });
      }
    }

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, tag, status, sort } = req.query;
    
    let query = { status: 'published' };

    if (status === 'draft') {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required for drafts' });
      }
      query.status = 'draft';
      if (req.user.role !== 'admin') {
        query.author = req.user._id;
      }
    } else if (status === 'published' || !status) {
      query.status = 'published';
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    if (category) {
      query.category = category;
    }
    if (tag) {
      query.tags = tag;
    }

    let sortOptions = { createdAt: -1 };
    if (sort === 'views') {
      sortOptions = { views: -1 };
    } else if (sort === 'likes') {
      sortOptions = { 'likes.length': -1 }; // Note: Sorting by array length in MongoDB find() is tricky with sort(), but views is straightforward
    }

    const posts = await Post.find(query)
      .populate('author', 'username avatar followers isVerifiedCreator')
      .populate('category', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sortOptions);

    const count = await Post.countDocuments(query);

    res.json({
      posts,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getPostBySlug = async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug })
      .populate('author', 'username avatar followers isVerifiedCreator')
      .populate('category', 'name');
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.status === 'draft') {
      if (!req.user || (req.user.role !== 'admin' && post.author._id.toString() !== req.user._id.toString())) {
        return res.status(403).json({ message: 'Unauthorized access to draft' });
      }
    }

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const incrementViews = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.views += 1;
    await post.save();
    res.json({ views: post.views });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Snapshot current state before changes (restore/comparison support).
    await createRevisionSnapshot({ post, userId: req.user._id, reason: 'manual' });

    const updateData = { ...req.body };

    // Scheduled publishing support
    if (updateData.scheduledAt) {
      updateData.scheduledAt = new Date(updateData.scheduledAt);
    }
    if (updateData.status === 'published') {
      updateData.publishedAt = post.publishedAt || new Date();
      updateData.scheduledAt = null;
    }

    if (updateData.category) {
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(updateData.category)) {
        let cat = await Category.findOne({ name: new RegExp('^' + updateData.category + '$', 'i') });
        if (!cat) {
          cat = new Category({ 
            name: updateData.category.charAt(0).toUpperCase() + updateData.category.slice(1), 
            slug: updateData.category.toLowerCase() 
          });
          await cat.save();
        }
        updateData.category = cat._id;
      }
    }

    const oldStatus = post.status;
    const updatedPost = await Post.findByIdAndUpdate(req.params.id, updateData, { new: true });

    // Notify followers if status changed from draft to published (manual publish)
    if (oldStatus === 'draft' && updatedPost.status === 'published') {
      const user = await User.findById(req.user._id);
      if (user && user.followers.length > 0) {
        const io = req.app.get('io');
        user.followers.forEach(followerId => {
          createNotification(io, {
            recipient: followerId,
            sender: req.user._id,
            type: 'post',
            post: updatedPost._id
          });
        });
      }
    }

    res.json(updatedPost);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const autosavePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (!canEditPost(req.user, post)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const allowedFields = ['title', 'content', 'excerpt', 'category', 'tags', 'featuredImage', 'scheduledAt'];
    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    // Normalize tags
    if (updates.tags && typeof updates.tags === 'string') {
      updates.tags = updates.tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    // Resolve category fallback string to real Category id (same logic as create/update).
    if (updates.category) {
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(updates.category)) {
        let cat = await Category.findOne({ name: new RegExp('^' + updates.category + '$', 'i') });
        if (!cat) {
          cat = new Category({
            name: updates.category.charAt(0).toUpperCase() + updates.category.slice(1),
            slug: updates.category.toLowerCase()
          });
          await cat.save();
        }
        updates.category = cat._id;
      }
    }

    if (updates.scheduledAt) {
      updates.scheduledAt = new Date(updates.scheduledAt);
    }

    const hasChange = Object.keys(updates).some((k) => {
      if (k === 'tags') return JSON.stringify(post.tags || []) !== JSON.stringify(updates.tags || []);
      if (k === 'category') return post.category.toString() !== updates.category.toString();
      return (post[k] || '') !== (updates[k] || '');
    });

    if (!hasChange) {
      return res.json({ saved: false, updatedAt: post.updatedAt });
    }

    await createRevisionSnapshot({ post, userId: req.user._id, reason: 'autosave' });

    Object.assign(post, updates);
    await post.save();

    res.json({ saved: true, updatedAt: post.updatedAt });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const listRevisions = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).select('author');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (!canEditPost(req.user, post)) return res.status(403).json({ message: 'Unauthorized' });

    const revisions = await PostRevision.find({ post: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('_id reason createdAt snapshotHash title status')
      .lean();

    res.json(revisions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getRevision = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).select('author');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (!canEditPost(req.user, post)) return res.status(403).json({ message: 'Unauthorized' });

    const rev = await PostRevision.findOne({ _id: req.params.revId, post: req.params.id }).lean();
    if (!rev) return res.status(404).json({ message: 'Revision not found' });

    res.json(rev);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const restoreRevision = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (!canEditPost(req.user, post)) return res.status(403).json({ message: 'Unauthorized' });

    const rev = await PostRevision.findOne({ _id: req.params.revId, post: req.params.id }).lean();
    if (!rev) return res.status(404).json({ message: 'Revision not found' });

    // Snapshot current before restoring.
    await createRevisionSnapshot({ post, userId: req.user._id, reason: 'restore' });

    post.title = rev.title;
    post.content = rev.content;
    post.excerpt = rev.excerpt || '';
    post.category = rev.category;
    post.tags = rev.tags || [];
    post.featuredImage = rev.featuredImage || '';
    post.scheduledAt = rev.scheduledAt || null;
    post.status = rev.status || post.status;
    if (post.status === 'published' && !post.publishedAt) post.publishedAt = new Date();
    await post.save();

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getTrendingPosts = async (req, res) => {
  try {
    const { page = 1, limit = 6, days = 7 } = req.query;
    const nowMs = Date.now();
    const since = new Date(nowMs - Number(days) * 24 * 60 * 60 * 1000);

    const pool = await Post.find({ status: 'published', createdAt: { $gte: since } })
      .populate('author', 'username avatar followers isVerifiedCreator')
      .populate('category', 'name')
      .limit(250)
      .lean();

    const scored = pool
      .map((p) => ({ ...p, _score: computeTrendingScore(p, nowMs) }))
      .sort((a, b) => b._score - a._score);

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const start = (pageNum - 1) * limitNum;
    const pageItems = scored.slice(start, start + limitNum).map(({ _score, ...rest }) => rest);

    res.json({
      posts: pageItems,
      totalPages: Math.ceil(scored.length / limitNum),
      currentPage: pageNum
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getForYouPosts = async (req, res) => {
  try {
    if (!req.user) {
      return getTrendingPosts(req, res);
    }

    const { page = 1, limit = 6 } = req.query;
    const nowMs = Date.now();

    const me = await User.findById(req.user._id).select('following bookmarks').lean();
    const following = (me?.following || []).map(String);
    const bookmarks = me?.bookmarks || [];

    let tagSignals = [];
    let categorySignals = [];
    if (bookmarks.length > 0) {
      const bookmarkedPosts = await Post.find({ _id: { $in: bookmarks } })
        .select('tags category')
        .limit(25)
        .lean();
      const tagCounts = new Map();
      const catCounts = new Map();
      for (const bp of bookmarkedPosts) {
        for (const t of bp.tags || []) tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
        const catId = bp.category?.toString?.() ? bp.category.toString() : String(bp.category);
        if (catId) catCounts.set(catId, (catCounts.get(catId) || 0) + 1);
      }
      tagSignals = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t]) => t);
      categorySignals = Array.from(catCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c);
    }

    const or = [];
    if (following.length > 0) or.push({ author: { $in: following } });
    if (tagSignals.length > 0) or.push({ tags: { $in: tagSignals } });
    if (categorySignals.length > 0) or.push({ category: { $in: categorySignals } });

    const query = or.length > 0 ? { status: 'published', $or: or } : { status: 'published' };

    const pool = await Post.find(query)
      .populate('author', 'username avatar followers isVerifiedCreator')
      .populate('category', 'name')
      .limit(300)
      .lean();

    const scored = pool
      .map((p) => {
        const base = computeTrendingScore(p, nowMs);
        const authorId = p.author?._id ? p.author._id.toString() : p.author?.toString?.() || '';
        const isFollowed = authorId && following.includes(authorId);
        const tags = p.tags || [];
        const tagMatches = tagSignals.reduce((sum, t) => sum + (tags.includes(t) ? 1 : 0), 0);
        const catId = p.category?._id ? p.category._id.toString() : p.category?.toString?.() || '';
        const catBoost = catId && categorySignals.includes(catId) ? 0.25 : 0;

        const score = base * (1 + (isFollowed ? 0.75 : 0) + tagMatches * 0.15 + catBoost);
        return { ...p, _score: score };
      })
      .sort((a, b) => b._score - a._score);

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const start = (pageNum - 1) * limitNum;
    const pageItems = scored.slice(start, start + limitNum).map(({ _score, ...rest }) => rest);

    res.json({
      posts: pageItems,
      totalPages: Math.ceil(scored.length / limitNum),
      currentPage: pageNum
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getSimilarPosts = async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    const current = await Post.findOne({ slug: req.params.slug, status: 'published' }).lean();
    if (!current) return res.status(404).json({ message: 'Post not found' });

    const currentTags = current.tags || [];
    const currentCat = current.category?.toString?.() ? current.category.toString() : String(current.category);

    const candidates = await Post.find({
      _id: { $ne: current._id },
      status: 'published',
      $or: [
        { category: currentCat },
        ...(currentTags.length > 0 ? [{ tags: { $in: currentTags } }] : [])
      ]
    })
      .populate('author', 'username avatar followers isVerifiedCreator')
      .populate('category', 'name')
      .limit(120)
      .lean();

    const scored = candidates
      .map((p) => {
        const sameCategory = (p.category?._id ? p.category._id.toString() : p.category?.toString?.() || '') === currentCat;
        const sharedTags = currentTags.reduce((sum, t) => sum + ((p.tags || []).includes(t) ? 1 : 0), 0);
        const score = (sameCategory ? 2 : 0) + sharedTags;
        return { ...p, _score: score };
      })
      .sort((a, b) => (b._score - a._score) || (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
      .slice(0, Number(limit))
      .map(({ _score, ...rest }) => rest);

    res.json(scored);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const index = post.likes.indexOf(req.user._id);
    if (index === -1) {
      post.likes.push(req.user._id);
      
      // Notify author
      if (post.author.toString() !== req.user._id.toString()) {
        const io = req.app.get('io');
        createNotification(io, {
          recipient: post.author,
          sender: req.user._id,
          type: 'like',
          post: post._id
        });
      }
    } else {
      post.likes.splice(index, 1);
    }

    await post.save();
    res.json(post.likes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getRelatedPosts = async (req, res) => {
  try {
    const { categoryId, currentPostId } = req.query;
    const related = await Post.find({
      category: categoryId,
      _id: { $ne: currentPostId },
      status: 'published'
    })
    .limit(3)
    .populate('author', 'username avatar followers isVerifiedCreator')
    .populate('category', 'name');
    
    res.json(related);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAuthorStats = async (req, res) => {
  try {
    const authorId = req.user._id;
    const posts = await Post.find({ author: authorId });
    
    const totalViews = posts.reduce((sum, post) => sum + (post.views || 0), 0);
    const totalLikes = posts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
    const publishedCount = posts.filter(p => p.status === 'published').length;
    const draftCount = posts.filter(p => p.status === 'draft').length;
    
    res.json({
      totalViews,
      totalLikes,
      publishedCount,
      draftCount,
      totalPosts: posts.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createPost,
  getPosts,
  getPostBySlug,
  updatePost,
  deletePost,
  toggleLike,
  incrementViews,
  getRelatedPosts,
  getAuthorStats,
  autosavePost,
  listRevisions,
  getRevision,
  restoreRevision,
  getTrendingPosts,
  getForYouPosts,
  getSimilarPosts
};
