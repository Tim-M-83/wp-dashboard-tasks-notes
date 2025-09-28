# Dashboard Tasks & Notes

A beautiful WordPress plugin that adds a modern dashboard widget for admins to manage personal notes and task lists. Features colorful gradients, real-time saving, admin-only visibility, and complete user data isolation. Makes staying organized on your WordPress dashboard effortless!

## Features

- **Personal Notes**: Save and edit text notes directly on your WordPress dashboard
- **Task Lists**: Create, edit, and manage task items with checkmark completion
- **Admin Only**: Only visible to users with administrator privileges
- **Modern Design**: Colorful gradients and smooth animations
- **Real-time Saving**: AJAX-powered saves with loading indicators
- **User Isolation**: Each admin user has their own private notes and tasks
- **Responsive**: Works well on desktop and mobile devices

## Installation

1. Download the plugin files.
2. Put all files from this repo into one main folder "dashboard-tasks-notes".
3. Upload the `dashboard-tasks-notes` folder to your `/wp-content/plugins/` directory, or upload the zipped folder Plugins -> Add New Plugin.
4. Activate the plugin through the WordPress admin dashboard under Plugins → Installed Plugins.
5. The widget will automatically appear on your dashboard.

## Usage

### Notes Section
- Click in the textarea to add or edit your personal notes
- Notes are automatically saved when you finish typing (with a 1-second delay)
- Or click the "Save Notes" button to save immediately
- Your notes are saved per user and only visible to you

### Task Lists Section
- Enter a new task in the input field and click "Add Task" or press Enter
- Tasks are saved automatically when added
- Click the checkbox to mark tasks as completed
- Hover over a task to reveal edit and delete buttons
- Click the ✏️ (edit) button to inline edit the task text
- Click the 🗑️ (delete) button to remove a task (with confirmation)
- View completion summary at the bottom

## Data Storage

All notes and tasks are stored as WordPress options with user-specific keys:
- Notes: `dtn_notes_{user_id}`
- Tasks: `dtn_tasks_{user_id}`

This ensures complete user isolation and privacy.

## Security

- Only users with the `administrator` capability can view the widget
- All AJAX requests are protected with WordPress nonces
- User data validation and sanitization
- XSS protection with proper escaping

## Requirements

- WordPress 5.0 or higher
- PHP 7.0 or higher
- Administrator privileges

## Customization

The plugin is designed to be easily customizable:
- Colors and gradients can be modified in `assets/css/dashboard.css`
- JavaScript functionality can be extended in `assets/js/dashboard.js`
- PHP hooks and filters can be added for further integration

## Screenshots

The widget features:
- Beautiful gradient backgrounds
- Smooth hover effects and animations
- Custom checkbox styling
- Modern card-based design
- Mobile-responsive layout

## Development

### File Structure
```
dashboard-tasks-notes/
├── dashboard-tasks-notes.php      # Main plugin file
├── assets/
│   ├── css/
│   │   └── dashboard.css         # Styles
│   └── js/
│       └── dashboard.js          # JavaScript functionality
└── README.md                     # This file
```

### Hooks
- `wp_dashboard_setup`: Registers the dashboard widget
- `wp_ajax_dtn_save_notes`: AJAX handler for saving notes
- `wp_ajax_dtn_save_tasks`: AJAX handler for saving tasks
- `wp_register_activation_hook`: Creates asset directories on activation

## Changelog

### Version 1.0.0
- Initial release
- Notes and task management functionality
- Modern colorful design
- Admin-only visibility
- AJAX saving with feedback
- User data isolation
- Responsive design

## License

This plugin is licensed under the GPL v2 or later.

## Author

AI Assistant

## Support

This is a simple plugin for personal use. For support or customization requests, please check the code yourself or hire a developer.

## Future Enhancements

Potential improvements could include:
- Task categories/tags
- Due dates for tasks
- Priority levels
- Task sorting and filtering
- Export/import functionality
- Bulk task operations
- Integration with other plugins
