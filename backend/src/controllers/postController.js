const Post = require('../models/Post');
const User = require('../models/User');
const Category = require('../models/Category');
const { createNotification } = require('./notificationController');

const createPost = async (req, res) => {
  try {
    const { title, content, category, tags, status, excerpt, featuredImage } = req.body;
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
      featuredImage
    });

    await post.save();

    // Notify followers if published
    if (status === 'published') {
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

    const updateData = { ...req.body };

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

    // Notify followers if status changed from draft to published
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

module.exports = { createPost, getPosts, getPostBySlug, updatePost, deletePost, toggleLike, incrementViews, getRelatedPosts, getAuthorStats };
