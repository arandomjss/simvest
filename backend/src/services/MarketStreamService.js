import WebSocket from 'ws';
import protobuf from 'protobufjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import NodeCache from 'node-cache';
import { getWebSocketAuthUrl } from '../config/upstox.config.js';
import { getAllInstrumentKeys, getSymbolFromKey } from '../config/nifty50.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Price cache with 5-second TTL
const priceCache = new NodeCache({ stdTTL: 5 });

class MarketStreamService {
    constructor(io) {
        this.io = io; // Socket.io instance for broadcasting
        this.ws = null;
        this.proto = null;
        this.FeedResponse = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 1000; // Start with 1 second
        this.maxReconnectDelay = 30000; // Max 30 seconds
        this.heartbeatInterval = null;
        this.lastMessageTime = Date.now();
        this.isConnecting = false;
    }

    /**
     * Initialize ProtoBuf schema
     */
    async loadProtoSchema() {
        try {
            const protoPath = join(__dirname, '../proto/MarketDataFeedV3.proto');
            this.proto = await protobuf.load(protoPath);
            this.FeedResponse = this.proto.lookupType('com.upstox.marketdatafeederv3udapi.rpc.proto.FeedResponse');
            console.log('✅ ProtoBuf schema loaded successfully');
            return true;
        } catch (error) {
            console.error('❌ Error loading ProtoBuf schema:', error);
            throw error;
        }
    }

    /**
     * Connect to Upstox WebSocket
     */
    async connect() {
        if (this.isConnecting) {
            console.log('⚠️  Connection already in progress');
            return;
        }

        this.isConnecting = true;

        try {
            // Load ProtoBuf schema if not already loaded
            if (!this.FeedResponse) {
                await this.loadProtoSchema();
            }

            // Get authorized WebSocket URL
            const wsUrl = await getWebSocketAuthUrl();
            console.log('🔗 Connecting to Upstox WebSocket...');

            // Create WebSocket connection with auto-redirect
            this.ws = new WebSocket(wsUrl, {
                followRedirects: true,
                handshakeTimeout: 10000
            });

            this.setupEventHandlers();

        } catch (error) {
            console.error('❌ Error connecting to WebSocket:', error.message);
            this.isConnecting = false;
            this.scheduleReconnect();
        }
    }

    /**
     * Setup WebSocket event handlers
     */
    setupEventHandlers() {
        this.ws.on('open', () => {
            console.log('✅ WebSocket connected');
            this.isConnecting = false;
            this.reconnectAttempts = 0;
            this.reconnectDelay = 1000;
            this.lastMessageTime = Date.now();

            // Subscribe to NIFTY 50 stocks
            this.subscribeToInstruments();

            // Start heartbeat monitoring
            this.startHeartbeatMonitor();
        });

        this.ws.on('message', (data) => {
            this.handleMessage(data);
        });

        this.ws.on('error', (error) => {
            console.error('❌ WebSocket error:', error.message);
        });

        this.ws.on('close', (code, reason) => {
            console.log(`🔌 WebSocket closed: ${code} - ${reason}`);
            this.stopHeartbeatMonitor();
            this.scheduleReconnect();
        });

        this.ws.on('ping', () => {
            this.ws.pong();
            this.lastMessageTime = Date.now();
        });
    }

    /**
     * Subscribe to NIFTY 50 instruments
     */
    subscribeToInstruments() {
        const instrumentKeys = getAllInstrumentKeys();

        if (instrumentKeys.length === 0) {
            console.error('❌ No instrument keys loaded');
            return;
        }

        const subscriptionMessage = {
            guid: 'someguid',
            method: 'sub',
            data: {
                mode: 'ltpc', // Last Traded Price
                instrumentKeys: instrumentKeys
            }
        };

        this.ws.send(JSON.stringify(subscriptionMessage));
        console.log(`📡 Subscribed to ${instrumentKeys.length} NIFTY 50 instruments`);
    }

    /**
     * Handle incoming WebSocket messages
     */
    handleMessage(data) {
        this.lastMessageTime = Date.now();

        try {
            // Decode ProtoBuf binary message
            const buffer = Buffer.from(data);
            const feedResponse = this.FeedResponse.decode(buffer);
            const decodedData = this.FeedResponse.toObject(feedResponse, {
                longs: String,
                enums: String,
                bytes: String
            });

            // Process feeds
            if (decodedData.feeds) {
                Object.entries(decodedData.feeds).forEach(([instrumentKey, feed]) => {
                    this.processFeed(instrumentKey, feed);
                });
            }

        } catch (error) {
            // Skip malformed messages
            console.warn('⚠️  Error decoding message:', error.message);
        }
    }

    /**
     * Process individual feed data
     */
    processFeed(instrumentKey, feed) {
        const symbol = getSymbolFromKey(instrumentKey);

        if (!symbol) {
            return; // Skip unknown instruments
        }

        // Extract LTPC (Last Traded Price, Time, Quantity)
        let ltp = null;

        if (feed.ltpc) {
            ltp = feed.ltpc.ltp;
        } else if (feed.fullFeed?.marketFF?.ltpc) {
            ltp = feed.fullFeed.marketFF.ltpc.ltp;
        } else if (feed.fullFeed?.indexFF?.ltpc) {
            ltp = feed.fullFeed.indexFF.ltpc.ltp;
        }

        if (ltp) {
            // Cache price
            priceCache.set(instrumentKey, ltp);

            // Broadcast to Socket.io room
            const priceUpdate = {
                symbol,
                instrumentKey,
                ltp,
                timestamp: Date.now()
            };

            this.io.to(`room:${instrumentKey}`).emit('price_update', priceUpdate);
            this.io.to('room:all').emit('price_update', priceUpdate);
        }
    }

    /**
     * Start heartbeat monitor
     */
    startHeartbeatMonitor() {
        this.heartbeatInterval = setInterval(() => {
            const timeSinceLastMessage = Date.now() - this.lastMessageTime;

            if (timeSinceLastMessage > 60000) { // 60 seconds
                console.warn('⚠️  No data received for 60 seconds, reconnecting...');
                this.disconnect();
                this.connect();
            }
        }, 10000); // Check every 10 seconds
    }

    /**
     * Stop heartbeat monitor
     */
    stopHeartbeatMonitor() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Schedule reconnection with exponential backoff
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);

        console.log(`🔄 Reconnecting in ${delay / 1000} seconds (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            this.connect();
        }, delay);
    }

    /**
     * Get cached price for an instrument
     */
    getCachedPrice(instrumentKey) {
        return priceCache.get(instrumentKey);
    }

    /**
     * Disconnect WebSocket
     */
    disconnect() {
        this.stopHeartbeatMonitor();

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

export default MarketStreamService;
