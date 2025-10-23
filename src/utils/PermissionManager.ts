import type { PermissionState, PermissionResult, PermissionInstructions } from './types';

export class PermissionManager {
  private permissionChangeCallbacks: ((state: PermissionState) => void)[] = [];

  /**
   * Check current permission state
   */
  async checkPermission(): Promise<PermissionState> {
    try {
      if (!navigator.permissions) {
        // Fallback: try to get user media to check permission
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          return 'granted';
        } catch (error) {
          if (error instanceof Error && error.name === 'NotAllowedError') {
            return 'denied';
          }
          return 'prompt';
        }
      }

      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return permission.state as PermissionState;
    } catch (error) {
      console.warn('Could not check microphone permission:', error);
      return 'unknown';
    }
  }

  /**
   * Request microphone permission
   */
  async requestPermission(): Promise<PermissionResult> {
    try {
      // Try to get user media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Stop the stream immediately
      stream.getTracks().forEach(track => track.stop());

      return {
        granted: true,
        state: 'granted',
        requiresManualGrant: false
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          return {
            granted: false,
            state: 'denied',
            error: 'Microphone permission denied',
            requiresManualGrant: true
          };
        } else if (error.name === 'NotFoundError') {
          return {
            granted: false,
            state: 'denied',
            error: 'No microphone found',
            requiresManualGrant: false
          };
        }
      }

      return {
        granted: false,
        state: 'denied',
        error: error instanceof Error ? error.message : 'Permission request failed',
        requiresManualGrant: false
      };
    }
  }

  /**
   * Get permission instructions for specific browser
   */
  getPermissionInstructions(browser: string): PermissionInstructions {
    const browserLower = browser.toLowerCase();

    if (browserLower.includes('chrome')) {
      return {
        browser: 'Chrome',
        steps: [
          'Click the lock icon (🔒) in the address bar',
          'Find "Microphone" in the permissions list',
          'Change from "Block" to "Allow"',
          'Refresh the page'
        ]
      };
    } else if (browserLower.includes('firefox')) {
      return {
        browser: 'Firefox',
        steps: [
          'Click the lock icon (🔒) in the address bar',
          'Click "Connection secure" → "More information"',
          'Go to the "Permissions" tab',
          'Find "Use the Microphone" and click "Allow"',
          'Refresh the page'
        ]
      };
    } else if (browserLower.includes('safari')) {
      return {
        browser: 'Safari',
        steps: [
          'Go to Safari → Preferences → Websites',
          'Select "Microphone" from the left sidebar',
          'Find your site and change to "Allow"',
          'Refresh the page'
        ]
      };
    } else if (browserLower.includes('edge')) {
      return {
        browser: 'Edge',
        steps: [
          'Click the lock icon (🔒) in the address bar',
          'Click "Permissions for this site"',
          'Find "Microphone" and change to "Allow"',
          'Refresh the page'
        ]
      };
    } else {
      return {
        browser: 'Your Browser',
        steps: [
          'Look for a lock or settings icon in the address bar',
          'Find microphone or audio permissions',
          'Change the setting to "Allow"',
          'Refresh the page'
        ]
      };
    }
  }

  /**
   * Monitor permission changes
   */
  onPermissionChange(callback: (state: PermissionState) => void): void {
    this.permissionChangeCallbacks.push(callback);

    // Try to set up permission change listener
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then(permission => {
          permission.addEventListener('change', () => {
            const newState = permission.state as PermissionState;
            this.notifyPermissionChange(newState);
          });
        })
        .catch(error => {
          console.warn('Could not monitor permission changes:', error);
        });
    }
  }

  /**
   * Remove permission change callback
   */
  removePermissionChangeCallback(callback: (state: PermissionState) => void): void {
    const index = this.permissionChangeCallbacks.indexOf(callback);
    if (index > -1) {
      this.permissionChangeCallbacks.splice(index, 1);
    }
  }

  /**
   * Notify permission change callbacks
   */
  private notifyPermissionChange(state: PermissionState): void {
    this.permissionChangeCallbacks.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error in permission change callback:', error);
      }
    });
  }
}
