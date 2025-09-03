// import React, { useState, useEffect } from 'react';
// import './ChannelUsersModal.css';

// const ChannelUsersModal = ({ channel, currentUserId, onClose }) => {
//   const [activeTab, setActiveTab] = useState('members');
//   const [members, setMembers] = useState([]);
//   const [blockedUsers, setBlockedUsers] = useState([]);
//   const [isCreator, setIsCreator] = useState(false);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     fetchChannelData();
//   }, [channel._id]);

//   const fetchChannelData = async () => {
//     try {
//       setLoading(true);
      
//       // Fetch members
//       const membersRes = await fetch('http://localhost:5000/api/channel/get-channel-users', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${localStorage.getItem('token')}`
//         },
//         body: JSON.stringify({ channelId: channel._id })
//       });
//       const membersData = await membersRes.json();
      
//       if (membersData.message === "successfully get the channel") {
//         setMembers(membersData.data.members);
//         setIsCreator(membersData.data.createdBy === currentUserId);
//       }

//       // Fetch blocked users
//       const blockedRes = await fetch('http://localhost:5000/api/channel/get-channel-block-users', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${localStorage.getItem('token')}`
//         },
//         body: JSON.stringify({ channelId: channel._id })
//       });
//       const blockedData = await blockedRes.json();
      
//       if (blockedData.message === "successfully get the channel") {
//         setBlockedUsers(blockedData.data.blockedUsers || []);
//       }

//     } catch (error) {
//       console.error('Error fetching channel data:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleRemoveUser = async (userId) => {
//     try {
//       const response = await fetch('http://localhost:5000/api/channel/remove-user-from-channel', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${localStorage.getItem('token')}`
//         },
//         body: JSON.stringify({
//           channelId: channel._id,
//           otherUserId: userId
//         })
//       });

//       const data = await response.json();
//       if (data.message === "successfully removes the user from the event") {
//         setMembers(prev => prev.filter(member => member._id !== userId));
//       }
//     } catch (error) {
//       console.error('Error removing user:', error);
//     }
//   };

//   const handleBlockUser = async (userId) => {
//     try {
//       const response = await fetch('http://localhost:5000/api/channel/block-user', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${localStorage.getItem('token')}`
//         },
//         body: JSON.stringify({
//           channelId: channel._id,
//           otherUserId: userId
//         })
//       });

//       const data = await response.json();
//       if (data.message === "User blocked successfully") {
//         // Remove from members and add to blocked users
//         setMembers(prev => prev.filter(member => member._id !== userId));
//         fetchChannelData(); // Refresh blocked users list
//       }
//     } catch (error) {
//       console.error('Error blocking user:', error);
//     }
//   };

//   const handleUnblockUser = async (userId) => {
//     try {
//       const response = await fetch('http://localhost:5000/api/channel/unblock-user-from-channel', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${localStorage.getItem('token')}`
//         },
//         body: JSON.stringify({
//           channelId: channel._id,
//           otherUserId: userId
//         })
//       });

//       const data = await response.json();
//       if (data.message === "User unblocked successfully") {
//         setBlockedUsers(prev => prev.filter(user => user._id !== userId));
//         fetchChannelData(); // Refresh members list
//       }
//     } catch (error) {
//       console.error('Error unblocking user:', error);
//     }
//   };

//   return (
//     <div className="channel-users-modal-overlay">
//       <div className="channel-users-modal">
//         <div className="modal-header">
//           <h2>Manage #{channel.name} Users</h2>
//           <button className="close-btn" onClick={onClose}>&times;</button>
//         </div>

//         <div className="tabs">
//           <button 
//             className={activeTab === 'members' ? 'active' : ''}
//             onClick={() => setActiveTab('members')}
//           >
//             Members ({members.length})
//           </button>
//           <button 
//             className={activeTab === 'blocked' ? 'active' : ''}
//             onClick={() => setActiveTab('blocked')}
//           >
//             Blocked Users ({blockedUsers.length})
//           </button>
//         </div>

//         {loading ? (
//           <div className="loading">Loading...</div>
//         ) : (
//           <div className="users-list">
//             {activeTab === 'members' ? (
//               <>
//                 {members.length === 0 ? (
//                   <div className="empty-list">No members in this channel</div>
//                 ) : (
//                   members.map(user => (
//                     <div key={user._id} className="user-item">
//                       <div className="user-info">
//                         <span className="user-name">{user.name}</span>
//                         <span className="user-email">{user.email}</span>
//                       </div>
//                       {isCreator && user._id !== currentUserId && (
//                         <div className="user-actions">
//                           <button 
//                             onClick={() => handleRemoveUser(user._id)}
//                             className="action-btn remove-btn"
//                           >
//                             Remove this is sfdlkasdbjkabs
//                           </button>
//                           <button 
//                             onClick={() => handleBlockUser(user._id)}
//                             className="action-btn block-btn"
//                           >
//                             Block
//                           </button>
//                         </div>
//                       )}
//                     </div>
//                   ))
//                 )}
//               </>
//             ) : (
//               <>
//                 {blockedUsers.length === 0 ? (
//                   <div className="empty-list">No blocked users</div>
//                 ) : (
//                   blockedUsers.map(user => (
//                     <div key={user._id} className="user-item">
//                       <div className="user-info">
//                         <span className="user-name">{user.name}</span>
//                         <span className="user-email">{user.email}</span>
//                       </div>
//                       {isCreator && (
//                         <button 
//                           onClick={() => handleUnblockUser(user._id)}
//                           className="action-btn unblock-btn"
//                         >
//                           Unblock
//                         </button>
//                       )}
//                     </div>
//                   ))
//                 )}
//               </>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ChannelUsersModal;