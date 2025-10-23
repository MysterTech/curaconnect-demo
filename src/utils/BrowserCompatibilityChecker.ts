import type {
  BrowserInfo,
  BrowserFeature,
  CompatibilityResult,
  BrowserRecommendation
} from './types';

export class BrowserCompatibilityChecker {
  /**
   * Check browser compatibility
   */
  checkCompatibility(): CompatibilityResult {
    const browserInfo = this.getBrowserInfo();
    const supportedFeatures: BrowserFeature[] = [];
    const unsupportedFeatures: BrowserFeature[] = [];
    const warnings: string[] = [];

    // Check each feature
    const features: BrowserFeature[] = [
      'getUserMedia',
      'mediaRecorder',
      'audioContext',
      'webAudio',
      'opus',
      'webm'
    ];

    features.forEach(feature => {
      if (this.checkFeature(feature)) {
        supportedFeatures.push(feature);
      } else {
        unsupportedFeatures.push(feature);
      }
    });

    // Determine if compatible
    const isCompatible = this.checkFeature('getUserMedia') &&
                        this.checkFeature('mediaRecorder') &&
                        this.checkFeature('audioContext');

    // Add warnings for partial support
    if (!this.checkFeature('opus')) {
      warnings.push('Opus codec not supported - audio quality may be reduced');
    }

    if (!this.checkFeature('webm')) {
      warnings.push('WebM format not supported - using fallback format');
    }

    return {
      isCompatible,
      browserInfo,
      supportedFeatures,
      unsupportedFeatures,
      warnings,
      canProceedWithLimitations: supportedFeatures.length >= 3
    };
  }

  /**
   * Get browser information
   */
  getBrowserInfo(): BrowserInfo {
    const userAgent = navigator.userAgent;
    
    return {
      name: this.getBrowserName(),
      version: this.getBrowserVersion(),
      platform: navigator.platform,
      userAgent
    };
  }

  /**
   * Check if a specific feature is supported
   */
  checkFeature(feature: BrowserFeature): boolean {
    switch (feature) {
      case 'getUserMedia':
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      
      case 'mediaRecorder':
        return !!window.MediaRecorder;
      
      case 'audioContext':
        return !!(window.AudioContext || (window as any).webkitAudioContext);
      
      case 'webAudio':
        return !!(window.AudioContext || (window as any).webkitAudioContext);
      
      case 'opus':
        if (!window.MediaRecorder) return false;
        return MediaRecorder.isTypeSupported('audio/webm;codecs=opus');
      
      case 'webm':
        if (!window.MediaRecorder) return false;
        return MediaRecorder.isTypeSupported('audio/webm');
      
      default:
        return false;
    }
  }

  /**
   * Get recommended browsers
   */
  getRecommendedBrowsers(): BrowserRecommendation[] {
    return [
      {
        name: 'Chrome',
        minVersion: '90',
        downloadUrl: 'https://www.google.com/chrome/',
        features: ['getUserMedia', 'mediaRecorder', 'audioContext', 'webAudio', 'opus', 'webm']
      },
      {
        name: 'Firefox',
        minVersion: '88',
        downloadUrl: 'https://www.mozilla.org/firefox/',
        features: ['getUserMedia', 'mediaRecorder', 'audioContext', 'webAudio', 'opus', 'webm']
      },
      {
        name: 'Edge',
        minVersion: '90',
        downloadUrl: 'https://www.microsoft.com/edge',
        features: ['getUserMedia', 'mediaRecorder', 'audioContext', 'webAudio', 'opus', 'webm']
      },
      {
        name: 'Safari',
        minVersion: '14',
        downloadUrl: 'https://www.apple.com/safari/',
        features: ['getUserMedia', 'mediaRecorder', 'audioContext', 'webAudio']
      }
    ];
  }

  /**
   * Get browser name
   */
  private getBrowserName(): string {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      return 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      return 'Firefox';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      return 'Safari';
    } else if (userAgent.includes('Edg')) {
      return 'Edge';
    } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
      return 'Opera';
    } else {
      return 'Unknown';
    }
  }

  /**
   * Get browser version
   */
  private getBrowserVersion(): string {
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/(Chrome|Firefox|Safari|Edg|Opera|OPR)\/(\d+)/);
    return match ? match[2] : 'Unknown';
  }
}
