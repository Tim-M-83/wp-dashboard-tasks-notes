/**
 * Dashboard Tasks & Notes - JavaScript functionality
 * Handles AJAX operations and UI interactions
 */

(function($) {
    'use strict';

    // Cache commonly used elements
    var $notesTextarea = $('#dtn-notes');
    var $saveNotesBtn = $('#dtn-save-notes');
    var $newTaskInput = $('#dtn-new-task-input');
    var $addTaskBtn = $('#dtn-add-task');
    var $tasksList = $('#dtn-tasks-list');

    // Initialize
    $(document).ready(function() {
        bindEvents();
        updateTasksSummary();
    });

    /**
     * Bind all event handlers
     */
    function bindEvents() {
        // Notes saving
        $saveNotesBtn.on('click', saveNotes);
        $notesTextarea.on('blur', autoSaveNotes);

        // Task management
        $addTaskBtn.on('click', addNewTask);
        $newTaskInput.on('keypress', function(e) {
            if (e.which === 13) { // Enter key
                e.preventDefault();
                addNewTask();
            }
        });

        // Task interactions (using event delegation for dynamic elements)
        $tasksList.on('change', '.dtn-task-checkbox-input', toggleTaskCompletion);
        $tasksList.on('click', '.dtn-edit-task', editTask);
        $tasksList.on('click', '.dtn-delete-task', deleteTask);
        $tasksList.on('keydown', '.dtn-task-edit-input', handleEditKeydown);
        $tasksList.on('blur', '.dtn-task-edit-input', finishEditTask);
    }

    /**
     * Save notes via AJAX
     */
    function saveNotes() {
        var notes = $notesTextarea.val();

        showButtonLoading($saveNotesBtn);

        $.ajax({
            url: dtn_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'dtn_save_notes',
                nonce: dtn_ajax.nonce,
                user_id: dtn_ajax.user_id,
                notes: notes
            },
            success: function(response) {
                if (response.success) {
                    showSaveSuccess($saveNotesBtn);
                } else {
                    showSaveError($saveNotesBtn, response.data.message || dtn_ajax.strings.save_error);
                }
            },
            error: function() {
                showSaveError($saveNotesBtn, dtn_ajax.strings.save_error);
            }
        });
    }

    /**
     * Auto-save notes on blur (with debounce)
     */
    var autoSaveTimeout;
    function autoSaveNotes() {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(function() {
            var currentNotes = $notesTextarea.val();
            var originalNotes = $notesTextarea.data('original-value') || '';

            // Only save if content changed
            if (currentNotes !== originalNotes) {
                saveNotes();
            }
        }, 1000); // 1 second debounce
    }

    /**
     * Add a new task
     */
    function addNewTask() {
        var taskText = $newTaskInput.val().trim();

        if (!taskText) {
            return;
        }

        // Get current tasks
        var tasks = getCurrentTasksData();

        // Add new task
        tasks.push({
            text: taskText,
            completed: false
        });

        // Clear input
        $newTaskInput.val('');

        // Save tasks
        saveTasks(tasks);

        // Add to UI
        var taskIndex = tasks.length - 1;
        addTaskToUI(taskText, false, taskIndex);

        // Update summary
        updateTasksSummary();
    }

    /**
     * Toggle task completion
     */
    function toggleTaskCompletion() {
        var $checkbox = $(this);
        var taskIndex = parseInt($checkbox.data('index'));
        var isCompleted = $checkbox.is(':checked');

        // Update UI immediately
        var $taskItem = $checkbox.closest('.dtn-task-item');
        $taskItem.toggleClass('completed', isCompleted);

        // Get current tasks and update
        var tasks = getCurrentTasksData();
        if (tasks[taskIndex]) {
            tasks[taskIndex].completed = isCompleted;
        }

        // Save tasks
        saveTasks(tasks);

        // Update summary
        updateTasksSummary();
    }

    /**
     * Edit a task inline
     */
    function editTask() {
        var $editBtn = $(this);
        var $taskItem = $editBtn.closest('.dtn-task-item');
        var $taskText = $taskItem.find('.dtn-task-text');
        var currentText = $taskText.text();
        var taskIndex = parseInt($taskItem.data('index'));

        // Replace text with input
        $taskText.replaceWith('<input type="text" class="dtn-task-edit-input" value="' + escapeHtml(currentText) + '" data-index="' + taskIndex + '">');

        // Focus and select all
        var $editInput = $taskItem.find('.dtn-task-edit-input');
        $editInput.focus();
        $editInput.select();
    }

    /**
     * Handle edit input keydown
     */
    function handleEditKeydown(e) {
        if (e.which === 13) { // Enter key
            e.preventDefault();
            finishEditTask.call(this);
        } else if (e.which === 27) { // Escape key
            e.preventDefault();
            cancelEditTask.call(this);
        }
    }

    /**
     * Finish editing task
     */
    function finishEditTask() {
        var $input = $(this);
        var newText = $input.val().trim();
        var taskIndex = parseInt($input.data('index'));

        if (!newText) {
            cancelEditTask.call(this);
            return;
        }

        // Replace input with text
        $input.replaceWith('<span class="dtn-task-text">' + escapeHtml(newText) + '</span>');

        // Update tasks data
        var tasks = getCurrentTasksData();
        if (tasks[taskIndex]) {
            tasks[taskIndex].text = newText;
        }

        // Save tasks
        saveTasks(tasks);
    }

    /**
     * Cancel editing task
     */
    function cancelEditTask() {
        var $input = $(this);
        var taskIndex = parseInt($input.data('index'));

        // Get original text and replace input
        var tasks = getCurrentTasksData();
        var originalText = tasks[taskIndex] ? tasks[taskIndex].text : '';

        $input.replaceWith('<span class="dtn-task-text">' + escapeHtml(originalText) + '</span>');
    }

    /**
     * Delete a task
     */
    function deleteTask() {
        var $deleteBtn = $(this);
        var $taskItem = $deleteBtn.closest('.dtn-task-item');
        var taskIndex = parseInt($taskItem.data('index'));

        // Show confirmation (you can customize this)
        if (!confirm(dtn_ajax.strings.confirm_delete)) {
            return;
        }

        // Remove from UI
        $taskItem.remove();

        // Remove from data
        var tasks = getCurrentTasksData();
        tasks.splice(taskIndex, 1);

        // Save tasks
        saveTasks(tasks);

        // Update summary
        updateTasksSummary();
    }

    /**
     * Save tasks via AJAX
     */
    function saveTasks(tasks) {
        $.ajax({
            url: dtn_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'dtn_save_tasks',
                nonce: dtn_ajax.nonce,
                user_id: dtn_ajax.user_id,
                tasks: JSON.stringify(tasks)
            },
            success: function(response) {
                if (response.success) {
                    // Success - could add visual feedback if desired
                } else {
                    console.error('Error saving tasks:', response.data.message);
                }
            },
            error: function() {
                console.error('AJAX error saving tasks');
            }
        });
    }

    /**
     * Get current tasks data from UI
     */
    function getCurrentTasksData() {
        var tasks = [];

        $('.dtn-task-item').each(function() {
            var $item = $(this);
            var taskText = $item.find('.dtn-task-text').text() || $item.find('.dtn-task-edit-input').val() || '';
            var isCompleted = $item.hasClass('completed') || $item.find('.dtn-task-checkbox-input').is(':checked');

            tasks.push({
                text: taskText.trim(),
                completed: isCompleted
            });
        });

        return tasks;
    }

    /**
     * Add a new task to the UI
     */
    function addTaskToUI(taskText, isCompleted, taskIndex) {
        var checked = isCompleted ? 'checked' : '';
        var completedClass = isCompleted ? 'completed' : '';

        var taskHtml = `
            <div class="dtn-task-item ${completedClass}" data-index="${taskIndex}">
                <label class="dtn-task-checkbox">
                    <input type="checkbox" class="dtn-task-checkbox-input" ${checked} data-index="${taskIndex}">
                    <span class="dtn-task-checkbox-mark"></span>
                </label>
                <div class="dtn-task-content">
                    <span class="dtn-task-text">${escapeHtml(taskText)}</span>
                    <div class="dtn-task-actions">
                        <button type="button" class="dtn-edit-task dtn-action-btn" data-index="${taskIndex}" title="${dtn_ajax.strings.edit_task || 'Edit Task'}">✏️</button>
                        <button type="button" class="dtn-delete-task dtn-action-btn" data-index="${taskIndex}" title="${dtn_ajax.strings.delete_task || 'Delete Task'}">🗑️</button>
                    </div>
                </div>
            </div>
        `;

        $('.dtn-no-tasks').remove(); // Remove empty state if it exists
        $tasksList.append(taskHtml);

        // Show summary if tasks now exist
        updateTasksSummary();
    }

    /**
     * Update tasks completion summary
     */
    function updateTasksSummary() {
        var totalTasks = $('.dtn-task-item').length;
        var completedTasks = $('.dtn-task-item.completed').length;

        $('.dtn-completed-count').text(completedTasks);
        $('.dtn-total-count').text(totalTasks);

        var $summary = $('.dtn-tasks-summary');
        if (totalTasks > 0) {
            $summary.show();
        } else {
            $summary.hide();
        }
    }

    /**
     * Show loading state on button
     */
    function showButtonLoading($button) {
        $button.prop('disabled', true);
        $button.find('.dtn-btn-text').hide();
        $button.find('.dtn-loader').show();
    }

    /**
     * Show success state on button
     */
    function showSaveSuccess($button) {
        // Store original value for auto-save
        $notesTextarea.data('original-value', $notesTextarea.val());

        $button.prop('disabled', false);
        $button.find('.dtn-btn-text').text(dtn_ajax.strings.saved || 'Saved!').show();
        $button.find('.dtn-loader').hide();

        // Reset button text after a delay
        setTimeout(function() {
            $button.find('.dtn-btn-text').text(dtn_ajax.strings.save || 'Save Notes');
        }, 2000);
    }

    /**
     * Show error state on button
     */
    function showSaveError($button, message) {
        $button.prop('disabled', false);
        $button.find('.dtn-btn-text').text(message || dtn_ajax.strings.save_error).show();
        $button.find('.dtn-loader').hide();

        // Reset button text after a delay
        setTimeout(function() {
            $button.find('.dtn-btn-text').text(dtn_ajax.strings.save || 'Save Notes');
        }, 3000);
    }

    /**
     * Escape HTML entities for safe display
     */
    function escapeHtml(text) {
        var map = {
            '&': '&',
            '<': '<',
            '>': '>',
            '"': '"',
            "'": '&#039;'
        };
        return (text + '').replace(/[&<>"']/g, function(m) { return map[m]; });
    }

})(jQuery);
