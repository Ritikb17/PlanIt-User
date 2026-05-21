import React, { useEffect, useState } from 'react';
import './Profile.css';
import Navbar from '../components/Navbar';
import axios from "axios";

const Profile = () => {
  const [user, setUser] = useState({});
  const [coverPicture, setCoverPicture] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    email: '',
    _id: '',
    name: '',
    isAccountPrivate: false
  });
  const [userNameMessage, setUsernameMessage] = useState('');
  const [isDisable, setIsDisable] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(2);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState('');
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  // ✅ Fetch main profile + actual images (as binary)
  useEffect(() => {
    const fetchProfileData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return console.error("No token found");

      try {
        // Fetch main profile info
        const profileRes = await fetch('http://localhost:5000/api/profile/get-profile', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!profileRes.ok) throw new Error('Failed to fetch user profile');
        const data = await profileRes.json();

        // Fetch actual profile picture as blob
        const profilePicRes = await fetch('http://localhost:5000/api/picture/my-profile-picture', {
          headers: { Authorization: `Bearer ${token}` },
        });

        let profilePicUrl = '';
        if (profilePicRes.ok) {
          const blob = await profilePicRes.blob();
          profilePicUrl = URL.createObjectURL(blob);
          setProfilePicture(profilePicUrl);
        }

        // Fetch actual cover picture as blob
        const coverPicRes = await fetch('http://localhost:5000/api/picture/my-cover-picture', {
          headers: { Authorization: `Bearer ${token}` },
        });

        let coverPicUrl = '';
        if (coverPicRes.ok) {
          const blob = await coverPicRes.blob();
          coverPicUrl = URL.createObjectURL(blob);
          setCoverPicture(coverPicUrl);
        }

        setUser({ ...data });
        setFormData({
          username: data.username,
          bio: data.bio,
          email: data.email,
          _id: data._id,
          name: data.name || '',
          isAccountPrivate: data.isAccountPrivate || false,
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };

    fetchProfileData();
  }, []);

  // ✅ Fetch user posts
  useEffect(() => {
    const fetchUserPosts = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      setPostsLoading(true);
      setPostsError('');

      try {
        const response = await axios.get(
          'http://localhost:5000/api/user-post/get-user-posts',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setPosts(response.data.posts || []);
      } catch (err) {
        console.error("Error fetching posts:", err);
        setPostsError("Failed to fetch your posts");
      } finally {
        setPostsLoading(false);
      }
    };

    fetchUserPosts();
  }, []);

  // Fetch suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await axios.get(
          `http://localhost:5000/api/user/get-suggestion?page=${page}&limit=${limit}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuggestions(response.data.nonFriends);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
        setError("Failed to fetch suggestions.");
      }
    };

    fetchSuggestions();
  }, [page, limit]);

  // Handle follow request
  const handleSendRequest = async (userId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.put(
        "http://localhost:5000/api/user/send-request",
        { _id: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuggestions((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      console.error("Error sending follow request:", err);
    }
  };

  // Handle like/unlike post
  const handleLikePost = async (postId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await axios.put(
        `http://localhost:5000/api/user-post/like-unlike-post/${postId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update posts state with new like status
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId
            ? { ...post, likes: response.data.likes }
            : post
        )
      );
    } catch (err) {
      console.error("Error liking/unliking post:", err);
      setError("Failed to update like status");
    }
  };

  // Open comment modal
  const handleOpenComments = async (post) => {
    setSelectedPost(post);
    setCommentModalOpen(true);
    await fetchComments(post._id);
  };

  // Fetch comments for a post
  const fetchComments = async (postId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoadingComments(true);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/user-post/get-comments/${postId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments(response.data.comments || []);
    } catch (err) {
      console.error("Error fetching comments:", err);
      setError("Failed to fetch comments");
    } finally {
      setLoadingComments(false);
    }
  };

  // Add comment
  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    const token = localStorage.getItem("token");
    if (!token || !selectedPost) return;

    try {
      const response = await axios.post(
        `http://localhost:5000/api/user-post/comment-on-post/${selectedPost._id}`,
        { comment: commentText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update comments list
      setComments([response.data.comment, ...comments]);
      setCommentText('');

      // Update post comment count
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === selectedPost._id
            ? { ...post, comments: [...post.comments, response.data.comment] }
            : post
        )
      );
    } catch (err) {
      console.error("Error adding comment:", err);
      setError("Failed to add comment");
    }
  };

  const handleEditProfile = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const handleCloseCommentModal = () => {
    setCommentModalOpen(false);
    setSelectedPost(null);
    setComments([]);
    setCommentText('');
  };

  // Username check
  const handleUsernameChange = async (event) => {
    const username = event.target.value;
    setFormData({ ...formData, username });
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await axios.get(
        `http://localhost:5000/api/profile/check-user-name?username=${username}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.allowed) {
        setUsernameMessage('Username Available');
        setIsDisable(false);
      } else {
        setUsernameMessage('Username Already Taken');
        setIsDisable(true);
        if (username === user.username) {
          setUsernameMessage('');
          setIsDisable(false);
        }
      }
    } catch (error) {
      console.error("Error verifying username:", error);
      setUsernameMessage('Failed to verify username');
      setIsDisable(true);
    }
  };

  // Handle other input fields
  const handleInputChange = (e) => {
    const { name, type, checked, value } = e.target;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      await axios.post(
        'http://localhost:5000/api/picture/upload/profilePicture',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Refresh profile picture
      const profilePicRes = await fetch('http://localhost:5000/api/picture/my-profile-picture', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (profilePicRes.ok) {
        const blob = await profilePicRes.blob();
        const profilePicUrl = URL.createObjectURL(blob);
        setProfilePicture(profilePicUrl);
      }

      console.log('Profile picture updated successfully');
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      setError('Failed to upload profile picture');
    }
  };

  // Handle cover picture upload
  const handleCoverPictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      await axios.post(
        'http://localhost:5000/api/picture/upload/coverPicture',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Refresh cover picture
      const coverPicRes = await fetch('http://localhost:5000/api/picture/my-cover-picture', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (coverPicRes.ok) {
        const blob = await coverPicRes.blob();
        const coverPicUrl = URL.createObjectURL(blob);
        setCoverPicture(coverPicUrl);
      }

      console.log('Cover picture updated successfully');
    } catch (err) {
      console.error('Error uploading cover picture:', err);
      setError('Failed to upload cover picture');
    }
  };

  // Update profile
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await axios.put(
        "http://localhost:5000/api/profile/update-profile",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUser(response.data.user);
      setIsModalOpen(false);
      setUsernameMessage('');
      setError('');
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile");
    }
  };

  // Check if user liked a post
  const isPostLiked = (post) => {
    const token = localStorage.getItem("token");
    if (!token) return false;
    // You might need to decode the token to get user ID or check from API response
    // For now, we'll check if the likes array contains the current user's ID
    // You should implement this based on your API response structure
    return post.likedByCurrentUser || false;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <Navbar />

      <div className="profile-page">
        {/* Cover Picture Section */}
        <div className="cover-picture-container">
          <img
            src={coverPicture || 'https://via.placeholder.com/800x200?text=Add+Cover+Photo'}
            alt="Cover"
            className="cover-picture"
          />
          <div className="cover-picture-edit">
            <input
              type="file"
              id="coverPictureInput"
              accept="image/*"
              onChange={handleCoverPictureUpload}
              style={{ display: 'none' }}
            />
            <label htmlFor="coverPictureInput" className="edit-picture-btn">
              Edit Cover
            </label>
          </div>
        </div>

        {/* User Information */}
        <div className="user-info">
          <div className="profile-picture-container">
            <img
              src={profilePicture || 'https://via.placeholder.com/150'}
              alt="Profile"
              className="profile-picture"
            />
            <div className="profile-picture-edit">
              <input
                type="file"
                id="profilePictureInput"
                accept="image/*"
                onChange={handleProfilePictureUpload}
                style={{ display: 'none' }}
              />
              <label htmlFor="profilePictureInput" className="edit-picture-btn">
                Edit Profile
              </label>
            </div>
          </div>
          <div className="user-details">
            <h1>{user.username}</h1>
            <p className="bio">{user.bio || 'Add bio'}</p>
            {user.isAccountPrivate && (
              <span className="private-badge">Private Account 🔒</span>
            )}
          </div>
        </div>

        <button className="edit-profile-btn" onClick={handleEditProfile}>
          Edit Profile Info
        </button>

        {/* Posts Section */}
        <div className="posts-section">
          <h2>Your Posts</h2>
          {postsLoading && <p>Loading your posts...</p>}
          {postsError && <p className="error-message">{postsError}</p>}
          {!postsLoading && !postsError && posts.length === 0 && (
            <p className="no-posts">No posts yet. Create your first post!</p>
          )}
          <div className="posts-grid">
            {posts.map((post) => (
              <div key={post._id} className="post-card">
                <div className="post-header">
                  <div className="post-info">
                    <h3>{user.username}</h3>
                    <span className="post-date">{formatDate(post.createdAt)}</span>
                  </div>
                  <span className={`post-privacy ${post.isPublic ? 'public' : 'private'}`}>
                    {post.isPublic ? '🌍 Public' : '🔒 Private'}
                  </span>
                </div>
                <p className="post-content">{post.content}</p>
                {post.imageURLs && post.imageURLs.length > 0 && (
                  <div className="post-images">
                    {post.imageURLs.map((imageUrl, index) => (
                      <img
                        key={index}
                        src={imageUrl}
                        alt={`Post image ${index + 1}`}
                        className="post-image"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                        }}
                      />
                    ))}
                  </div>
                )}
                <div className="post-actions">
                  <button 
                    className={`action-btn like-btn ${isPostLiked(post) ? 'liked' : ''}`}
                    onClick={() => handleLikePost(post._id)}
                  >
                    ❤️ {post.likes?.length || 0} Likes
                  </button>
                  <button 
                    className="action-btn comment-btn"
                    onClick={() => handleOpenComments(post)}
                  >
                    💬 {post.comments?.length || 0} Comments
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Discover People */}
        <div className="discover-people">
          <h2>Discover people</h2>
          {suggestions.map((s) => (
            <div className="account" key={s._id}>
              <div className="account-info">
                <h3>{s.username}</h3>
                <p>{s.bio || 'No bio available'}</p>
              </div>
              <button className="follow-btn" onClick={() => handleSendRequest(s._id)}>
                Follow
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Edit Profile Info</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {userNameMessage && (
              <p style={{ color: userNameMessage === 'Username Available' ? 'green' : 'red' }}>
                {userNameMessage}
              </p>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Username</label>
                <input 
                  type="text" 
                  name="username" 
                  value={formData.username} 
                  onChange={handleUsernameChange} 
                />
              </div>

              <div className="form-group">
                <label>Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                />
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea 
                  name="bio" 
                  value={formData.bio} 
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="isAccountPrivate"
                    checked={formData.isAccountPrivate}
                    onChange={handleInputChange}
                  />
                  Private account
                </label>
              </div>

              <div className="modal-buttons">
                <button type="button" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" disabled={isDisable}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {commentModalOpen && selectedPost && (
        <div className="modal-overlay">
          <div className="modal comment-modal">
            <h2>Comments</h2>
            <div className="comment-modal-content">
              <div className="original-post">
                <p className="post-content-preview">{selectedPost.content}</p>
                {selectedPost.imageURLs && selectedPost.imageURLs.length > 0 && (
                  <img 
                    src={selectedPost.imageURLs[0]} 
                    alt="Post preview" 
                    className="post-preview-image"
                  />
                )}
              </div>
              
              <div className="comments-section">
                <div className="add-comment">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    rows="3"
                  />
                  <button onClick={handleAddComment} className="post-comment-btn">
                    Post Comment
                  </button>
                </div>

                <div className="comments-list">
                  {loadingComments && <p>Loading comments...</p>}
                  {!loadingComments && comments.length === 0 && (
                    <p className="no-comments">No comments yet. Be the first to comment!</p>
                  )}
                  {comments.map((comment, index) => (
                    <div key={index} className="comment-item">
                      <div className="comment-header">
                        <strong>{comment.user?.username || 'User'}</strong>
                        <span className="comment-date">
                          {comment.createdAt && formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="comment-text">{comment.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-buttons">
              <button onClick={handleCloseCommentModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;