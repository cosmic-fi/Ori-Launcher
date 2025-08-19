<script>
    import { notificationService } from '../../services/notificationService.js';
    import { onMount } from 'svelte';
    
    let notifications = [];
    
    onMount(() => {
        notifications = notificationService.getHistory();
    });
    
    function clearHistory() {
        notificationService.clearHistory();
        notifications = [];
    }
    
    function formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString();
    }
    
    function getTypeIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            info: 'fa-info-circle',
            warning: 'fa-exclamation-triangle',
            error: 'fa-times-circle'
        };
        return icons[type] || icons.info;
    }
</script>

<div class="notification-history">
    <div class="history-header">
        <h3>Notification History</h3>
        <button class="clear-btn" on:click={clearHistory}>
            <i class="fa fa-trash"></i> Clear
        </button>
    </div>
    
    <div class="notifications-list">
        {#each notifications as notification (notification.timestamp)}
            <div class="notification-item {notification.type}">
                <div class="notification-icon">
                    <i class="fa {getTypeIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">{notification.title}</div>
                    <div class="notification-message">{notification.message}</div>
                    <div class="notification-time">{formatTime(notification.timestamp)}</div>
                </div>
            </div>
        {:else}
            <div class="no-notifications">
                <i class="fa fa-bell-slash"></i>
                <p>No notifications yet</p>
            </div>
        {/each}
    </div>
</div>

<style>
    .notification-history {
        max-width: 400px;
        max-height: 500px;
        background: var(--base-color);
        border-radius: 8px;
        border: 1px solid var(--border-color);
        overflow: hidden;
    }
    
    .history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px;
        background: var(--base-variant);
        border-bottom: 1px solid var(--border-color);
    }
    
    .history-header h3 {
        margin: 0;
        color: var(--text-color);
    }
    
    .clear-btn {
        background: var(--danger-color);
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8em;
    }
    
    .notifications-list {
        max-height: 400px;
        overflow-y: auto;
    }
    
    .notification-item {
        display: flex;
        padding: 12px 15px;
        border-bottom: 1px solid var(--border-color-25);
    }
    
    .notification-icon {
        margin-right: 12px;
        font-size: 1.2em;
    }
    
    .notification-item.success .notification-icon { color: var(--success-color); }
    .notification-item.info .notification-icon { color: var(--info-color); }
    .notification-item.warning .notification-icon { color: var(--warning-color); }
    .notification-item.error .notification-icon { color: var(--danger-color); }
    
    .notification-content {
        flex: 1;
    }
    
    .notification-title {
        font-weight: 600;
        color: var(--text-color);
        margin-bottom: 4px;
    }
    
    .notification-message {
        color: var(--text-color-75);
        font-size: 0.9em;
        margin-bottom: 4px;
    }
    
    .notification-time {
        color: var(--text-color-50);
        font-size: 0.8em;
    }
    
    .no-notifications {
        text-align: center;
        padding: 40px 20px;
        color: var(--text-color-50);
    }
    
    .no-notifications i {
        font-size: 2em;
        margin-bottom: 10px;
        display: block;
    }
</style>