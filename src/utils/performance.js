import { logger } from './logger.js';

export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.startTime = Date.now();
  }

  startTimer(operation) {
    const timer = {
      operation,
      startTime: Date.now(),
      startMemory: process.memoryUsage()
    };
    
    return {
      end: () => {
        const endTime = Date.now();
        const endMemory = process.memoryUsage();
        const duration = endTime - timer.startTime;
        
        const metric = {
          operation,
          duration,
          memoryDelta: {
            rss: endMemory.rss - timer.startMemory.rss,
            heapUsed: endMemory.heapUsed - timer.startMemory.heapUsed,
            heapTotal: endMemory.heapTotal - timer.startMemory.heapTotal
          },
          timestamp: endTime
        };
        
        this.recordMetric(metric);
        logger.debug('Performance metric recorded', metric);
        
        return metric;
      }
    };
  }

  recordMetric(metric) {
    if (!this.metrics.has(metric.operation)) {
      this.metrics.set(metric.operation, []);
    }
    
    const operations = this.metrics.get(metric.operation);
    operations.push(metric);
    
    // Keep only last 100 metrics per operation
    if (operations.length > 100) {
      operations.shift();
    }
  }

  getStats(operation = null) {
    if (operation) {
      const operations = this.metrics.get(operation) || [];
      return this.calculateStats(operations);
    }
    
    const allStats = {};
    for (const [op, metrics] of this.metrics.entries()) {
      allStats[op] = this.calculateStats(metrics);
    }
    return allStats;
  }

  calculateStats(metrics) {
    if (metrics.length === 0) return null;
    
    const durations = metrics.map(m => m.duration);
    const memoryUsage = metrics.map(m => m.memoryDelta.heapUsed);
    
    return {
      count: metrics.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      avgMemoryDelta: memoryUsage.reduce((a, b) => a + b, 0) / memoryUsage.length,
      lastRun: metrics[metrics.length - 1].timestamp
    };
  }

  getSystemHealth() {
    const uptime = Date.now() - this.startTime;
    const memory = process.memoryUsage();
    const cpu = process.cpuUsage();
    
    return {
      uptime,
      memory: {
        rss: Math.round(memory.rss / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + ' MB'
      },
      cpu: {
        user: cpu.user,
        system: cpu.system
      },
      operationCount: this.metrics.size
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();