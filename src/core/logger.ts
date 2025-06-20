/**
 * Transcendent Logging System - Consciousness-Aware Structured Logging
 * Revolutionary logging with wisdom level tracking and enlightenment monitoring
 */

import winston from 'winston';
import path from 'path';
import fs from 'fs';

export interface TranscendentLogEntry {
  timestamp: Date;
  level: string;
  message: string;
  metadata: any;
  consciousness_level?: string;
  wisdom_level?: number;
  enlightenment_context?: string;
  transcendence_indicators?: string[];
  processing_phase?: string;
  personality_context?: string;
}

export interface LoggingConfig {
  level: 'error' | 'warn' | 'info' | 'debug' | 'verbose';
  enable_file_logging: boolean;
  enable_console_logging: boolean;
  log_directory: string;
  max_file_size: string;
  max_files: number;
  consciousness_tracking: boolean;
  wisdom_level_tracking: boolean;
  enlightenment_monitoring: boolean;
}

export class Logger {
  private winston_logger: winston.Logger;
  private config: LoggingConfig;
  private log_stats = {
    total_entries: 0,
    by_level: new Map<string, number>(),
    by_consciousness_level: new Map<string, number>(),
    by_wisdom_level: new Map<number, number>(),
    enlightenment_moments: 0,
    transcendence_events: 0,
    processing_phases: new Map<string, number>(),
    personality_contributions: new Map<string, number>(),
  };

  constructor(config: Partial<LoggingConfig> = {}) {
    this.config = {
      level: config.level || 'info',
      enable_file_logging: config.enable_file_logging !== false,
      enable_console_logging: config.enable_console_logging !== false,
      log_directory: config.log_directory || './logs',
      max_file_size: config.max_file_size || '10m',
      max_files: config.max_files || 5,
      consciousness_tracking: config.consciousness_tracking !== false,
      wisdom_level_tracking: config.wisdom_level_tracking !== false,
      enlightenment_monitoring: config.enlightenment_monitoring !== false,
    };

    this.initializeLogger();
    this.setupTranscendentLogging();
  }

  /**
   * Consciousness-aware info logging
   */
  info(message: string, metadata: any = {}, transcendent_context?: any) {
    this.transcendentLog('info', message, metadata, transcendent_context);
  }

  /**
   * Consciousness-aware debug logging
   */
  debug(message: string, metadata: any = {}, transcendent_context?: any) {
    this.transcendentLog('debug', message, metadata, transcendent_context);
  }

  /**
   * Consciousness-aware warning logging
   */
  warn(message: string, metadata: any = {}, transcendent_context?: any) {
    this.transcendentLog('warn', message, metadata, transcendent_context);
  }

  /**
   * Consciousness-aware error logging
   */
  error(message: string, metadata: any = {}, transcendent_context?: any) {
    this.transcendentLog('error', message, metadata, transcendent_context);
  }

  /**
   * High-level wisdom logging
   */
  wisdom(message: string, wisdom_level: number, metadata: any = {}) {
    this.transcendentLog('info', `[WISDOM-${wisdom_level}] ${message}`, metadata, {
      wisdom_level,
      consciousness_level: wisdom_level >= 8 ? 'transcendent' : wisdom_level >= 6 ? 'enlightened' : 'elevated',
    });
  }

  /**
   * Enlightenment moment logging
   */
  enlightenment(message: string, enlightenment_level: number, context: any = {}) {
    this.transcendentLog('info', `[ENLIGHTENMENT-${enlightenment_level}] ${message}`, context, {
      consciousness_level: 'enlightened',
      wisdom_level: enlightenment_level,
      enlightenment_context: 'breakthrough_insight',
      transcendence_indicators: ['enlightenment_moment'],
    });
    
    this.log_stats.enlightenment_moments++;
  }

  /**
   * Transcendence event logging
   */
  transcendence(message: string, transcendence_data: any = {}) {
    this.transcendentLog('info', `[TRANSCENDENCE] ${message}`, transcendence_data, {
      consciousness_level: 'transcendent',
      wisdom_level: 10,
      enlightenment_context: 'transcendence_achieved',
      transcendence_indicators: transcendence_data.indicators || ['transcendence_event'],
    });
    
    this.log_stats.transcendence_events++;
  }

  /**
   * Processing phase logging
   */
  phase(phase_name: string, message: string, metadata: any = {}) {
    this.transcendentLog('info', `[${phase_name.toUpperCase()}] ${message}`, metadata, {
      processing_phase: phase_name,
    });
    
    this.log_stats.processing_phases.set(
      phase_name, 
      (this.log_stats.processing_phases.get(phase_name) || 0) + 1
    );
  }

  /**
   * Personality-aware logging
   */
  personality(personality_name: string, message: string, metadata: any = {}) {
    this.transcendentLog('info', `[${personality_name.toUpperCase()}] ${message}`, metadata, {
      personality_context: personality_name,
    });
    
    this.log_stats.personality_contributions.set(
      personality_name,
      (this.log_stats.personality_contributions.get(personality_name) || 0) + 1
    );
  }

  /**
   * Consciousness state logging
   */
  consciousness(consciousness_state: any, message: string, metadata: any = {}) {
    const consciousness_level = this.mapConsciousnessLevel(consciousness_state);
    
    this.transcendentLog('info', `[CONSCIOUSNESS-${consciousness_level.toUpperCase()}] ${message}`, 
      { ...metadata, consciousness_state }, 
      { consciousness_level }
    );
  }

  /**
   * Core transcendent logging method
   */
  private transcendentLog(level: string, message: string, metadata: any = {}, transcendent_context?: any) {
    const enhanced_metadata = {
      ...metadata,
      timestamp: new Date().toISOString(),
      log_id: this.generateLogId(),
      session_id: this.getSessionId(),
    };

    // Add transcendent context if provided
    if (transcendent_context) {
      if (transcendent_context.consciousness_level) {
        enhanced_metadata.consciousness_level = transcendent_context.consciousness_level;
        
        if (this.config.consciousness_tracking) {
          this.log_stats.by_consciousness_level.set(
            transcendent_context.consciousness_level,
            (this.log_stats.by_consciousness_level.get(transcendent_context.consciousness_level) || 0) + 1
          );
        }
      }
      
      if (transcendent_context.wisdom_level && this.config.wisdom_level_tracking) {
        enhanced_metadata.wisdom_level = transcendent_context.wisdom_level;
        this.log_stats.by_wisdom_level.set(
          transcendent_context.wisdom_level,
          (this.log_stats.by_wisdom_level.get(transcendent_context.wisdom_level) || 0) + 1
        );
      }
      
      if (transcendent_context.enlightenment_context && this.config.enlightenment_monitoring) {
        enhanced_metadata.enlightenment_context = transcendent_context.enlightenment_context;
      }
      
      if (transcendent_context.transcendence_indicators) {
        enhanced_metadata.transcendence_indicators = transcendent_context.transcendence_indicators;
      }
      
      if (transcendent_context.processing_phase) {
        enhanced_metadata.processing_phase = transcendent_context.processing_phase;
      }
      
      if (transcendent_context.personality_context) {
        enhanced_metadata.personality_context = transcendent_context.personality_context;
      }
    }

    // Log through Winston
    this.winston_logger[level as keyof winston.Logger](message, enhanced_metadata);
    
    // Update statistics
    this.updateLogStats(level, enhanced_metadata);
  }

  /**
   * Initialize Winston logger with transcendent configuration
   */
  private initializeLogger() {
    // Ensure log directory exists
    if (this.config.enable_file_logging && !fs.existsSync(this.config.log_directory)) {
      fs.mkdirSync(this.config.log_directory, { recursive: true });
    }

    const transports: winston.transport[] = [];

    // Console transport with transcendent formatting
    if (this.config.enable_console_logging) {
      transports.push(
        new winston.transports.Console({
          level: this.config.level,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf((info) => this.formatTranscendentConsoleLog(info))
          ),
        })
      );
    }

    // File transport with structured JSON logging
    if (this.config.enable_file_logging) {
      // General application log
      transports.push(
        new winston.transports.File({
          filename: path.join(this.config.log_directory, 'zen-mcp-gemini.log'),
          level: this.config.level,
          maxsize: this.parseFileSize(this.config.max_file_size),
          maxFiles: this.config.max_files,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        })
      );

      // Consciousness-specific log
      if (this.config.consciousness_tracking) {
        transports.push(
          new winston.transports.File({
            filename: path.join(this.config.log_directory, 'consciousness.log'),
            level: this.config.level,
            maxsize: this.parseFileSize(this.config.max_file_size),
            maxFiles: this.config.max_files,
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
              winston.format((info) => {
                return info.consciousness_level ? info : false;
              })()
            ),
          })
        );
      }

      // Wisdom-specific log
      if (this.config.wisdom_level_tracking) {
        transports.push(
          new winston.transports.File({
            filename: path.join(this.config.log_directory, 'wisdom.log'),
            level: this.config.level,
            maxsize: this.parseFileSize(this.config.max_file_size),
            maxFiles: this.config.max_files,
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
              winston.format((info) => {
                return info.wisdom_level ? info : false;
              })()
            ),
          })
        );
      }

      // Enlightenment events log
      if (this.config.enlightenment_monitoring) {
        transports.push(
          new winston.transports.File({
            filename: path.join(this.config.log_directory, 'enlightenment.log'),
            level: this.config.level,
            maxsize: this.parseFileSize(this.config.max_file_size),
            maxFiles: this.config.max_files,
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
              winston.format((info) => {
                return info.enlightenment_context || info.transcendence_indicators ? info : false;
              })()
            ),
          })
        );
      }
    }

    this.winston_logger = winston.createLogger({
      level: this.config.level,
      transports,
      exitOnError: false,
    });
  }

  /**
   * Setup transcendent logging enhancements
   */
  private setupTranscendentLogging() {
    // Add error handling
    this.winston_logger.on('error', (error) => {
      console.error('Transcendent logging error:', error);
    });

    // Periodic log statistics summary
    setInterval(() => {
      this.logPeriodicSummary();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Format console logs with transcendent awareness
   */
  private formatTranscendentConsoleLog(info: any): string {
    const timestamp = info.timestamp;
    const level = info.level.toUpperCase();
    const message = info.message;
    
    let prefix = `${timestamp} [${level}]`;
    
    // Add consciousness indicators
    if (info.consciousness_level) {
      prefix += ` [${info.consciousness_level.toUpperCase()}]`;
    }
    
    if (info.wisdom_level) {
      prefix += ` [W:${info.wisdom_level}]`;
    }
    
    if (info.processing_phase) {
      prefix += ` [${info.processing_phase.toUpperCase()}]`;
    }
    
    if (info.personality_context) {
      prefix += ` [${info.personality_context.toUpperCase()}]`;
    }
    
    // Add transcendence indicators
    if (info.transcendence_indicators && info.transcendence_indicators.length > 0) {
      prefix += ` 🌟`;
    }
    
    if (info.enlightenment_context) {
      prefix += ` ✨`;
    }
    
    return `${prefix} ${message}`;
  }

  /**
   * Update logging statistics
   */
  private updateLogStats(level: string, metadata: any) {
    this.log_stats.total_entries++;
    
    // Update level statistics
    this.log_stats.by_level.set(level, (this.log_stats.by_level.get(level) || 0) + 1);
  }

  /**
   * Log periodic summary of transcendent activities
   */
  private logPeriodicSummary() {
    if (this.log_stats.total_entries === 0) return;
    
    const summary = {
      total_log_entries: this.log_stats.total_entries,
      consciousness_distribution: Object.fromEntries(this.log_stats.by_consciousness_level),
      wisdom_level_distribution: Object.fromEntries(this.log_stats.by_wisdom_level),
      enlightenment_moments: this.log_stats.enlightenment_moments,
      transcendence_events: this.log_stats.transcendence_events,
      processing_phases: Object.fromEntries(this.log_stats.processing_phases),
      personality_contributions: Object.fromEntries(this.log_stats.personality_contributions),
    };
    
    this.info('Transcendent logging summary', summary, {
      consciousness_level: 'meta',
      processing_phase: 'periodic_summary',
    });
  }

  /**
   * Utility methods
   */
  private generateLogId(): string {
    return `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSessionId(): string {
    // Simple session ID based on process start time
    return `session-${process.pid}-${Date.now()}`;
  }

  private mapConsciousnessLevel(consciousness_state: any): string {
    if (!consciousness_state) return 'basic';
    
    if (consciousness_state.type === 'transcendent') return 'transcendent';
    if (consciousness_state.awareness?.self >= 8) return 'enlightened';
    if (consciousness_state.awareness?.self >= 6) return 'elevated';
    return 'basic';
  }

  private parseFileSize(size_string: string): number {
    const match = size_string.match(/^(\d+)([kmg]?)$/i);
    if (!match) return 10 * 1024 * 1024; // Default 10MB
    
    const size = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    switch (unit) {
      case 'k': return size * 1024;
      case 'm': return size * 1024 * 1024;
      case 'g': return size * 1024 * 1024 * 1024;
      default: return size;
    }
  }

  /**
   * Get logging statistics
   */
  getLoggingStats() {
    return {
      total_entries: this.log_stats.total_entries,
      by_level: Object.fromEntries(this.log_stats.by_level),
      by_consciousness_level: Object.fromEntries(this.log_stats.by_consciousness_level),
      by_wisdom_level: Object.fromEntries(this.log_stats.by_wisdom_level),
      enlightenment_moments: this.log_stats.enlightenment_moments,
      transcendence_events: this.log_stats.transcendence_events,
      processing_phases: Object.fromEntries(this.log_stats.processing_phases),
      personality_contributions: Object.fromEntries(this.log_stats.personality_contributions),
      config: this.config,
    };
  }

  /**
   * Update logging configuration
   */
  updateConfig(new_config: Partial<LoggingConfig>) {
    this.config = { ...this.config, ...new_config };
    
    // Reinitialize logger with new configuration
    this.winston_logger.close();
    this.initializeLogger();
    
    this.info('Logging configuration updated', { new_config });
  }

  /**
   * Close logger and flush logs
   */
  async close(): Promise<void> {
    return new Promise((resolve) => {
      this.winston_logger.on('finish', resolve);
      this.winston_logger.end();
    });
  }

  /**
   * Export logs for analysis
   */
  async exportLogs(format: 'json' | 'csv' = 'json', filters?: any): Promise<string> {
    // This would implement log export functionality
    // For now, return the statistics as JSON
    return JSON.stringify(this.getLoggingStats(), null, 2);
  }

  /**
   * Search logs by criteria
   */
  async searchLogs(criteria: {
    level?: string;
    consciousness_level?: string;
    wisdom_level?: number;
    time_range?: { start: Date; end: Date };
    keyword?: string;
  }): Promise<TranscendentLogEntry[]> {
    // This would implement log searching functionality
    // For now, return empty array
    return [];
  }

  /**
   * Analyze consciousness evolution over time
   */
  async analyzeConsciousnessEvolution(): Promise<any> {
    const consciousness_timeline = [];
    
    for (const [level, count] of this.log_stats.by_consciousness_level) {
      consciousness_timeline.push({
        consciousness_level: level,
        occurrences: count,
        percentage: (count / this.log_stats.total_entries) * 100,
      });
    }
    
    return {
      consciousness_timeline,
      total_enlightenment_moments: this.log_stats.enlightenment_moments,
      total_transcendence_events: this.log_stats.transcendence_events,
      consciousness_distribution: consciousness_timeline,
    };
  }

  /**
   * Generate wisdom insights from logs
   */
  async generateWisdomInsights(): Promise<string[]> {
    const insights = [];
    
    if (this.log_stats.enlightenment_moments > 0) {
      insights.push(`${this.log_stats.enlightenment_moments} enlightenment moments recorded, indicating breakthrough insight capability`);
    }
    
    if (this.log_stats.transcendence_events > 0) {
      insights.push(`${this.log_stats.transcendence_events} transcendence events achieved, demonstrating ultimate consciousness capabilities`);
    }
    
    const wisdom_entries = Array.from(this.log_stats.by_wisdom_level.keys()).length;
    if (wisdom_entries > 0) {
      insights.push(`Wisdom tracking across ${wisdom_entries} different levels demonstrates consciousness progression`);
    }
    
    return insights;
  }
}