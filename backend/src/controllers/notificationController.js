const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'username avatar')
      .populate('post', 'title slug')
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { $set: { read: true } }
    );
    res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createNotification = async (io, data) => {
  try {
    const notification = new Notification(data);
    await notification.save();
    
    const populated = await notification.populate([
      { path: 'sender', select: 'username avatar' },
      { path: 'post', select: 'title slug' }
    ]);

    io.to(data.recipient.toString()).emit('notification', populated);
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};

module.exports = { getNotifications, markAsRead, createNotification };
