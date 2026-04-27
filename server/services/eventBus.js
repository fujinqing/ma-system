const EventEmitter = require('events');
const { createEvent } = require('./eventSchema');

const SOURCE_SYSTEM = 'M-A-SYSTEM';

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
    this.eventHistory = [];
    this.maxHistorySize = 1000;
  }

  validateEvent(event) {
    const requiredFields = ['id', 'timestamp', 'sourceSystem', 'businessType', 'action', 'entityData'];
    for (const field of requiredFields) {
      if (!event[field]) {
        throw new Error(`Invalid event: missing required field '${field}'`);
      }
    }
    return true;
  }

  publish(eventName, payload) {
    try {
      let event;

      if (this.isStandardEvent(payload)) {
        event = payload;
      } else {
        event = createEvent(
          payload.businessType || 'unknown',
          payload.action || 'update',
          payload.entityData || payload,
          payload.operator || null,
          payload.extra || {}
        );
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

      console.log(`[EventBus] Published: ${eventName}`, JSON.stringify(event, null, 2));
      return event;
    } catch (error) {
      console.error(`[EventBus] Failed to publish event '${eventName}':`, error.message);
      throw error;
    }
  }

  isStandardEvent(payload) {
    return payload && payload.id && payload.timestamp && payload.sourceSystem;
  }

  subscribe(eventName, handler) {
    this.on(eventName, async (event) => {
      try {
        await handler(event);
      } catch (error) {
        console.error(`[EventBus] Handler error for '${eventName}':`, error.message);
      }
    });
    console.log(`[EventBus] Subscribed to: ${eventName}`);
  }

  subscribeAsync(eventName, handler) {
    this.on(eventName, async (event) => {
      try {
        const result = await handler(event);
        console.log(`[EventBus] Async handler completed for '${eventName}':`, event.id);
        return result;
      } catch (error) {
        console.error(`[EventBus] Async handler error for '${eventName}':`, error.message);
        throw error;
      }
    });
  }

  unsubscribe(eventName, handler) {
    this.off(eventName, handler);
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
}

const eventBus = new EventBus();

module.exports = eventBus;
