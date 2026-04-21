const User = require('../models/User');
const Post = require('../models/Post');
const { createNotification } = require('./notificationController');

const normalizeRole = (role) => (role === 'admin' ? 'admin' : 'user');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('followers', 'username avatar')
      .populate('following', 'username avatar')
      .lean();
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.role = normalizeRole(user.role);

    const posts = await Post.find({ author: user._id, status: 'published' })
      .sort({ createdAt: -1 });

    res.json({ user, posts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const toggleFollow = async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isFollowing = currentUser.following.includes(userToFollow._id);

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(id => id.toString() !== userToFollow._id.toString());
      userToFollow.followers = userToFollow.followers.filter(id => id.toString() !== currentUser._id.toString());
    } else {
      // Follow
      currentUser.following.push(userToFollow._id);
      userToFollow.followers.push(currentUser._id);

      // Notify followed user
      const io = req.app.get('io');
      createNotification(io, {
        recipient: userToFollow._id,
        sender: currentUser._id,
        type: 'follow'
      });
    }

    await currentUser.save();
    await userToFollow.save();

    res.json({ 
      isFollowing: !isFollowing,
      followersCount: userToFollow.followers.length 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

  const updateProfile = async (req, res) => {
  try {
    const { bio, socialLinks, avatar } = req.body;
    
    const updateData = {};
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (socialLinks !== undefined) updateData.socialLinks = socialLinks;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true }
    ).select('-password');

    const out = user.toObject ? user.toObject() : user;
    out.role = normalizeRole(out.role);

    res.json(out);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const toggleBookmark = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const postId = req.params.postId;
    
    const index = user.bookmarks.indexOf(postId);
    if (index === -1) {
      user.bookmarks.push(postId);
    } else {
      user.bookmarks.splice(index, 1);
    }
    
    await user.save();
    res.json(user.bookmarks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getBookmarks = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'bookmarks',
      populate: { path: 'author', select: 'username avatar' }
    });
    res.json(user.bookmarks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAuthors = async (req, res) => {
  try {
    const authors = await User.aggregate([
      {
        $addFields: {
          followersCount: { $size: { $ifNull: ['$followers', []] } }
        }
      },
      { $sort: { followersCount: -1, createdAt: -1 } },
      {
        $project: {
          username: 1,
          avatar: 1,
          bio: 1,
          followers: 1,
          followersCount: 1
        }
      }
    ]);

    res.json(authors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getProfile, toggleFollow, updateProfile, getAuthors, toggleBookmark, getBookmarks };
