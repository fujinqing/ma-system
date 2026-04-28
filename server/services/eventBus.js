const EventEmitter = require('events');
const { ALL_EVENT_NAMES } = require('./eventSchema');

const SOURCE_SYSTEM = 'ma-system';

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
    this.eventHistory = [];
    this.maxHistorySize = 1000;
    this.subscriptionCount = {};
  }

  validateEvent(event) {
    if (!event || typeof event !== 'object') {
      throw new Error('Invalid event: must be an object');
    }

    if (event.header) {
      const requiredFields = ['eventId', 'eventName', 'eventTime', 'sourceModule', 'tenantId', 'operatorId', 'operatorName', 'eventVersion', 'traceId', 'retryCount'];
      for (const field of requiredFields) {
        if (event.header[field] === undefined) {
          console.warn(`[EventBus] Event header missing field '${field}', using default`);
        }
      }
      return true;
    }

    if (event.id && event.timestamp && event.sourceSystem) {
      return true;
    }

    throw new Error('Invalid event: missing standard header or legacy fields');
  }

  publish(eventName, payload) {
    try {
      let event;

      if (this.isStandardEventFormat(payload)) {
        event = payload;
      } else {
        throw new Error('Event must use standard header + body format');
      }

      this.validateEvent(event);

      const eventRecord = {
        eventName,
        event,
        publishedAt: new Date().toISOString()
      };

      this.addToHistory(eventRecord);

      setImmediate(() => {
        this.emit(eventName, event);
      });

      console.log(`[EventBus] Published: ${eventName}`, {
        eventId: event.header?.eventId || event.id,
        eventName: event.header?.eventName || eventName,
        traceId: event.header?.traceId
      });
      return event;
    } catch (error) {
      console.error(`[EventBus] Failed to publish event '${eventName}':`, error.message);
      throw error;
    }
  }

  isStandardEventFormat(payload) {
    return payload && payload.header && payload.body;
  }

  subscribe(eventName, handler) {
    if (!this.subscriptionCount[eventName]) {
      this.subscriptionCount[eventName] = 0;
    }
    this.subscriptionCount[eventName]++;

    this.on(eventName, async (event) => {
      try {
        await handler(event);
      } catch (error) {
        console.error(`[EventBus] Handler error for '${eventName}':`, error.message);
      }
    });
    console.log(`[EventBus] Subscribed to: ${eventName} (count: ${this.subscriptionCount[eventName]})`);
  }

  subscribeAsync(eventName, handler) {
    this.on(eventName, async (event) => {
      try {
        const result = await handler(event);
        console.log(`[EventBus] Async handler completed for '${eventName}':`, event.header?.eventId);
        return result;
      } catch (error) {
        console.error(`[EventBus] Async handler error for '${eventName}':`, error.message);
        throw error;
      }
    });
  }

  subscribeAll(handler) {
    for (const eventName of ALL_EVENT_NAMES) {
      this.subscribe(eventName, handler);
    }
    console.log(`[EventBus] Subscribed to all ${ALL_EVENT_NAMES.length} events`);
  }

  unsubscribe(eventName, handler) {
    this.off(eventName, handler);
    if (this.subscriptionCount[eventName]) {
      this.subscriptionCount[eventName]--;
    }
    console.log(`[EventBus] Unsubscribed from: ${eventName}`);
  }

  addToHistory(record) {
    this.eventHistory.push(record);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  getHistory(eventName = null, limit = 100) {
    let history = this.eventHistory;
    if (eventName) {
      history = history.filter(h => h.eventName === eventName);
    }
    return history.slice(-limit);
  }

  clearHistory() {
    this.eventHistory = [];
  }

  getEventTypes() {
    return [...new Set(this.eventHistory.map(h => h.eventName))];
  }

  getSubscriptionCount(eventName = null) {
    if (eventName) {
      return this.subscriptionCount[eventName] || 0;
    }
    return { ...this.subscriptionCount };
  }

  getStats() {
    return {
      totalEvents: this.eventHistory.length,
      eventTypes: this.getEventTypes().length,
      subscriptions: this.getSubscriptionCount(),
      maxHistorySize: this.maxHistorySize
    };
  }
}

const eventBus = new EventBus();

module.exports = eventBus;
