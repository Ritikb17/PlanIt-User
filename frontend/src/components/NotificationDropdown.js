import React, { useState } from 'react';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li className="nav-item dropdown">
      <a
        className="nav-link dropdown-toggle"
        href="#"
        role="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        Notifications
      </a>
      <ul className="dropdown-menu">
        <li>
          <p className="dropdown-item">Notification 1</p>
        </li>
        <li>
          <p className="dropdown-item">Notification 2</p>
        </li>
      </ul>
    </li>
  );
};

export default NotificationDropdown;