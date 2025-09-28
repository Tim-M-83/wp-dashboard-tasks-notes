<?php
/**
 * Plugin Name: Dashboard Tasks & Notes
 * Plugin URI: https://github.com/Tim-M-83/wp-dashboard-tasks-notes
 * Description: A simple plugin to add personal notes and task lists directly to the WordPress admin dashboard. Only visible to administrators.
 * Version: 1.0.0
 * Author: Tim
 * Author URI: https://www.youtube.com/@Digital-Insight
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: dashboard-tasks-notes
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('DTN_PLUGIN_VERSION', '1.0.0');
define('DTN_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('DTN_PLUGIN_URL', plugin_dir_url(__FILE__));
define('DTN_TEXT_DOMAIN', 'dashboard-tasks-notes');

// Hook to add dashboard widget
add_action('wp_dashboard_setup', 'dtn_add_dashboard_widget');

/**
 * Add dashboard widget for tasks and notes
 */
function dtn_add_dashboard_widget() {
    // Only show to administrators
    if (!current_user_can('administrator')) {
        return;
    }

    wp_add_dashboard_widget(
        'dashboard_tasks_notes_widget',
        __('Tasks & Notes', DTN_TEXT_DOMAIN),
        'dtn_dashboard_widget_content',
        'dtn_dashboard_widget_control',
        array('__widget_basename' => __('Tasks & Notes', DTN_TEXT_DOMAIN)),
        'normal',
        'core'
    );
}

/**
 * Dashboard widget content
 */
function dtn_dashboard_widget_content($post, $callback_args) {
    $user_id = get_current_user_id();

    // Get saved notes
    $notes = get_option("dtn_notes_{$user_id}", '');
    $notes = sanitize_textarea_field($notes);

    // Get saved tasks
    $tasks = get_option("dtn_tasks_{$user_id}", array());

    // Enqueue scripts and styles
    wp_enqueue_script('dtn-dashboard-js', DTN_PLUGIN_URL . 'assets/js/dashboard.js', array('jquery'), DTN_PLUGIN_VERSION, true);
    wp_enqueue_style('dtn-dashboard-css', DTN_PLUGIN_URL . 'assets/css/dashboard.css', array(), DTN_PLUGIN_VERSION);

    // Localize script for AJAX
    wp_localize_script('dtn-dashboard-js', 'dtn_ajax', array(
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('dtn_ajax_nonce'),
        'user_id' => $user_id,
        'strings' => array(
            'confirm_delete' => __('Are you sure you want to delete this task?', DTN_TEXT_DOMAIN),
            'saving' => __('Saving...', DTN_TEXT_DOMAIN),
            'save_error' => __('Error saving data. Please try again.', DTN_TEXT_DOMAIN),
            'task_placeholder' => __('Enter new task...', DTN_TEXT_DOMAIN),
        )
    ));

    ?>
    <div class="dtn-widget-container">
        <!-- Notes Section -->
        <div class="dtn-section dtn-notes-section">
            <h3 class="dtn-section-title">
                <span class="dtn-icon dtn-notes-icon">📝</span>
                <?php _e('Personal Notes', DTN_TEXT_DOMAIN); ?>
            </h3>
            <div class="dtn-notes-wrapper">
                <textarea id="dtn-notes" class="dtn-notes-textarea" placeholder="<?php esc_attr_e('Write your notes here...', DTN_TEXT_DOMAIN); ?>" rows="4"><?php echo esc_textarea($notes); ?></textarea>
                <button type="button" id="dtn-save-notes" class="dtn-btn dtn-save-btn">
                    <span class="dtn-btn-text"><?php _e('Save Notes', DTN_TEXT_DOMAIN); ?></span>
                    <span class="dtn-loader" style="display:none;">⏳</span>
                </button>
            </div>
        </div>

        <!-- Tasks Section -->
        <div class="dtn-section dtn-tasks-section">
            <h3 class="dtn-section-title">
                <span class="dtn-icon dtn-tasks-icon">✅</span>
                <?php _e('Task List', DTN_TEXT_DOMAIN); ?>
            </h3>
            <div class="dtn-tasks-wrapper">
                <!-- Add New Task Form -->
                <div class="dtn-add-task">
                    <input type="text" id="dtn-new-task-input" class="dtn-new-task-input" placeholder="<?php esc_attr_e('Enter new task...', DTN_TEXT_DOMAIN); ?>">
                    <button type="button" id="dtn-add-task" class="dtn-btn dtn-add-btn">
                        <span class="dtn-btn-text"><?php _e('Add Task', DTN_TEXT_DOMAIN); ?></span>
                    </button>
                </div>

                <!-- Tasks List -->
                <div id="dtn-tasks-list" class="dtn-tasks-list">
                    <?php foreach ($tasks as $index => $task): ?>
                        <?php if (is_array($task) && isset($task['text']) && isset($task['completed'])): ?>
                            <div class="dtn-task-item <?php echo $task['completed'] ? 'completed' : ''; ?>" data-index="<?php echo esc_attr($index); ?>">
                                <label class="dtn-task-checkbox">
                                    <input type="checkbox"
                                           class="dtn-task-checkbox-input"
                                           <?php checked($task['completed'], true); ?>
                                           data-index="<?php echo esc_attr($index); ?>">
                                    <span class="dtn-task-checkbox-mark"></span>
                                </label>
                                <div class="dtn-task-content">
                                    <span class="dtn-task-text"><?php echo esc_html($task['text']); ?></span>
                                    <div class="dtn-task-actions">
                                        <button type="button" class="dtn-edit-task dtn-action-btn" data-index="<?php echo esc_attr($index); ?>" title="<?php esc_attr_e('Edit Task', DTN_TEXT_DOMAIN); ?>">✏️</button>
                                        <button type="button" class="dtn-delete-task dtn-action-btn" data-index="<?php echo esc_attr($index); ?>" title="<?php esc_attr_e('Delete Task', DTN_TEXT_DOMAIN); ?>">🗑️</button>
                                    </div>
                                </div>
                            </div>
                        <?php endif; ?>
                    <?php endforeach; ?>

                    <?php if (empty($tasks)): ?>
                        <div class="dtn-no-tasks">
                            <p><?php _e('No tasks yet. Add your first task above!', DTN_TEXT_DOMAIN); ?></p>
                        </div>
                    <?php endif; ?>
                </div>

                <?php if (!empty($tasks)): ?>
                    <div class="dtn-tasks-summary">
                        <span class="dtn-completed-count"><?php echo count(array_filter($tasks, function($t) { return isset($t['completed']) && $t['completed']; })); ?></span> / <span class="dtn-total-count"><?php echo count($tasks); ?></span> <?php _e('tasks completed', DTN_TEXT_DOMAIN); ?>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
    <?php
}

/**
 * Dashboard widget control (optional configuration)
 */
function dtn_dashboard_widget_control() {
    // No configuration options for now
}

/**
 * AJAX handler for saving notes
 */
add_action('wp_ajax_dtn_save_notes', 'dtn_save_notes_ajax');
function dtn_save_notes_ajax() {
    // Verify nonce
    if (!wp_verify_nonce($_POST['nonce'] ?? '', 'dtn_ajax_nonce')) {
        wp_die(__('Security check failed', DTN_TEXT_DOMAIN));
    }

    // Check permissions
    if (!current_user_can('administrator')) {
        wp_die(__('Insufficient permissions', DTN_TEXT_DOMAIN));
    }

    $user_id = intval($_POST['user_id'] ?? 0);
    $notes = sanitize_textarea_field($_POST['notes'] ?? '');

    if ($user_id && $user_id === get_current_user_id()) {
        update_option("dtn_notes_{$user_id}", $notes);
        wp_send_json_success(array('message' => __('Notes saved successfully', DTN_TEXT_DOMAIN)));
    } else {
        wp_send_json_error(array('message' => __('Invalid user or data', DTN_TEXT_DOMAIN)));
    }
}

/**
 * AJAX handler for saving tasks
 */
add_action('wp_ajax_dtn_save_tasks', 'dtn_save_tasks_ajax');
function dtn_save_tasks_ajax() {
    // Verify nonce
    if (!wp_verify_nonce($_POST['nonce'] ?? '', 'dtn_ajax_nonce')) {
        wp_die(__('Security check failed', DTN_TEXT_DOMAIN));
    }

    // Check permissions
    if (!current_user_can('administrator')) {
        wp_die(__('Insufficient permissions', DTN_TEXT_DOMAIN));
    }

    $user_id = intval($_POST['user_id'] ?? 0);
    $tasks = isset($_POST['tasks']) ? json_decode(stripslashes($_POST['tasks']), true) : array();

    // Validate and sanitize tasks
    $sanitized_tasks = array();
    if (is_array($tasks)) {
        foreach ($tasks as $task) {
            if (is_array($task) && isset($task['text'])) {
                $sanitized_tasks[] = array(
                    'text' => sanitize_text_field($task['text']),
                    'completed' => (bool) ($task['completed'] ?? false)
                );
            }
        }
    }

    if ($user_id && $user_id === get_current_user_id()) {
        update_option("dtn_tasks_{$user_id}", $sanitized_tasks);
        wp_send_json_success(array('message' => __('Tasks saved successfully', DTN_TEXT_DOMAIN)));
    } else {
        wp_send_json_error(array('message' => __('Invalid user or data', DTN_TEXT_DOMAIN)));
    }
}

/**
 * Create necessary directories on plugin activation
 */
register_activation_hook(__FILE__, 'dtn_plugin_activation');
function dtn_plugin_activation() {
    // Create assets directories if they don't exist
    $dirs = array(
        DTN_PLUGIN_DIR . 'assets',
        DTN_PLUGIN_DIR . 'assets/js',
        DTN_PLUGIN_DIR . 'assets/css'
    );

    foreach ($dirs as $dir) {
        if (!file_exists($dir)) {
            mkdir($dir, 0755, true);
        }
    }
}
