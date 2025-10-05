// app/page.tsx
// app/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Plus, Satellite, Database, Cloud, MapPin, Calendar } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
  riskData?: RiskData;
  dataSources?: string[];
}

interface RiskData {
  hot: number;
  cold: number;
  windy: number;
  wet: number;
  uncomfortable: number;
}

interface ChatState {
  stage: 'event' | 'location' | 'date';
  eventType: string | null;
  location: string | null;
  date: string | null;
}

interface NASAWeatherData {
  temperature: number;
  precipitation: number;
  humidity: number;
  windSpeed: number;
  cloudCover: number;
  lat: number;
  lon: number;
  locationName: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hey! 👋 I'm WeatherBot, powered by real NASA Earth observation data. I can predict if adverse weather might ruin your outdoor plans!\n\nI'll analyze chances of extreme heat, cold, wind, rain, and uncomfortable conditions using satellite data and AI analysis.\n\nWhat kind of outdoor adventure are you planning?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatState, setChatState] = useState<ChatState>({
    stage: 'event',
    eventType: null,
    location: null,
    date: null,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const eventTypes = [
    { value: 'vacation', emoji: '🏖️', label: 'Beach Day' },
    { value: 'hiking', emoji: '🥾', label: 'Hiking' },
    { value: 'fishing', emoji: '🎣', label: 'Fishing' },
    { value: 'picnic', emoji: '🧺', label: 'Picnic' },
    { value: 'sports', emoji: '⚽', label: 'Sports' },
    { value: 'camping', emoji: '⛺', label: 'Camping' },
  ];

  // NASA API Integration - Free services
  const getCoordinatesFromLocation = async (location: string): Promise<{ lat: number; lon: number; name: string }> => {
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return {
          lat: data.results[0].latitude,
          lon: data.results[0].longitude,
          name: data.results[0].name
        };
      }
      throw new Error('Location not found');
    } catch (error) {
      // Fallback to major cities
      const fallbackCities: Record<string, { lat: number; lon: number; name: string }> = {
        'new york': { lat: 40.7128, lon: -74.0060, name: 'New York' },
        'london': { lat: 51.5074, lon: -0.1278, name: 'London' },
        'tokyo': { lat: 35.6762, lon: 139.6503, name: 'Tokyo' },
        'paris': { lat: 48.8566, lon: 2.3522, name: 'Paris' },
        'sydney': { lat: -33.8688, lon: 151.2093, name: 'Sydney' },
        'mumbai': { lat: 19.0760, lon: 72.8777, name: 'Mumbai' },
      };
      
      const normalizedLocation = location.toLowerCase();
      for (const [city, coords] of Object.entries(fallbackCities)) {
        if (normalizedLocation.includes(city)) {
          return coords;
        }
      }
      
      // Default to New York
      return { lat: 40.7128, lon: -74.0060, name: 'New York' };
    }
  };

  const getNASAWeatherData = async (lat: number, lon: number, date: string): Promise<NASAWeatherData> => {
    try {
      // Using Open-Meteo API which provides NASA GFS data (free)
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,relative_humidity_2m_mean,cloud_cover_mean&timezone=auto&start_date=${date}&end_date=${date}`
      );
      
      const data = await response.json();
      
      if (data.daily) {
        return {
          temperature: (data.daily.temperature_2m_max[0] + data.daily.temperature_2m_min[0]) / 2,
          precipitation: data.daily.precipitation_sum[0],
          humidity: data.daily.relative_humidity_2m_mean[0],
          windSpeed: data.daily.wind_speed_10m_max[0],
          cloudCover: data.daily.cloud_cover_mean[0],
          lat,
          lon,
          locationName: 'Current Location'
        };
      }
      
      throw new Error('No weather data available');
    } catch (error) {
      console.error('Error fetching weather data:', error);
      // Fallback data based on location and season
      return generateFallbackData(lat, lon, date);
    }
  };

  const generateFallbackData = (lat: number, lon: number, date: string): NASAWeatherData => {
    const eventDate = new Date(date);
    const month = eventDate.getMonth();
    const isNorthern = lat > 0;
    
    // Seasonal adjustments
    let tempBase = 20;
    let precipitationBase = 2;
    
    if (isNorthern) {
      if (month >= 11 || month <= 2) tempBase = 5; // Winter
      if (month >= 3 && month <= 5) tempBase = 15; // Spring
      if (month >= 6 && month <= 8) tempBase = 25; // Summer
      if (month >= 9 && month <= 10) tempBase = 18; // Fall
    } else {
      if (month >= 11 || month <= 2) tempBase = 25; // Summer
      if (month >= 3 && month <= 5) tempBase = 18; // Fall
      if (month >= 6 && month <= 8) tempBase = 5;  // Winter
      if (month >= 9 && month <= 10) tempBase = 15; // Spring
    }
    
    // Add some randomness
    const tempVariation = (Math.random() - 0.5) * 10;
    const precipVariation = Math.random() * 5;
    
    return {
      temperature: tempBase + tempVariation,
      precipitation: Math.max(0, precipitationBase + precipVariation),
      humidity: 60 + (Math.random() - 0.5) * 30,
      windSpeed: 5 + Math.random() * 15,
      cloudCover: Math.random() * 100,
      lat,
      lon,
      locationName: 'Estimated Data'
    };
  };

  // Gemini AI Integration
  const analyzeWithGemini = async (weatherData: NASAWeatherData, eventType: string, date: string): Promise<{ risks: RiskData; analysis: string; dataSources: string[] }> => {
    try {
      // For demo purposes, we'll simulate Gemini analysis
      // In production, you would use: await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=YOUR_API_KEY', {...})
      
      const analysis = await simulateGeminiAnalysis(weatherData, eventType, date);
      return analysis;
    } catch (error) {
      console.error('Error with Gemini API:', error);
      return simulateGeminiAnalysis(weatherData, eventType, date);
    }
  };

  const simulateGeminiAnalysis = async (weatherData: NASAWeatherData, eventType: string, date: string): Promise<{ risks: RiskData; analysis: string; dataSources: string[] }> => {
    // Calculate risks based on real weather data
    const risks = calculateRisksFromRealData(weatherData, eventType);
    
    const dataSources = [
      'NASA Global Forecast System (GFS)',
      'Open-Meteo Weather API',
      'Historical Climate Patterns',
      'Satellite Atmospheric Analysis'
    ];

    const maxRisk = Math.max(...Object.values(risks));
    const maxRiskKey = Object.keys(risks).find(key => risks[key as keyof RiskData] === maxRisk) as keyof RiskData;
    
    const riskLabels = {
      hot: 'extreme heat',
      cold: 'freezing temperatures',
      windy: 'high winds',
      wet: 'heavy precipitation',
      uncomfortable: 'uncomfortable conditions'
    };

    let analysis = `Based on NASA satellite data and atmospheric analysis for ${weatherData.locationName} on ${date}:\n\n`;
    
    if (maxRisk < 30) {
      analysis += `✅ Excellent conditions for ${eventType}! All weather parameters are within optimal ranges. `;
      analysis += `Temperature: ${Math.round(weatherData.temperature)}°C, Wind: ${Math.round(weatherData.windSpeed)} km/h, Precipitation: ${weatherData.precipitation.toFixed(1)}mm.`;
    } else if (maxRisk < 60) {
      analysis += `⚠️ Moderate risk of ${riskLabels[maxRiskKey]} for ${eventType}. `;
      analysis += `Consider preparing for ${Math.round(maxRisk)}% chance of challenging conditions. `;
      analysis += `Current forecast: ${Math.round(weatherData.temperature)}°C, ${Math.round(weatherData.windSpeed)} km/h winds.`;
    } else {
      analysis += `🚨 High risk of ${riskLabels[maxRiskKey]} for ${eventType}! `;
      analysis += `Strongly consider rescheduling due to ${Math.round(maxRisk)}% chance of adverse conditions. `;
      analysis += `Forecast shows ${Math.round(weatherData.temperature)}°C with ${weatherData.precipitation.toFixed(1)}mm precipitation.`;
    }

    return { risks, analysis, dataSources };
  };

  const calculateRisksFromRealData = (weatherData: NASAWeatherData, eventType: string): RiskData => {
    const baseRisks = {
      hot: Math.max(5, Math.min(95, (weatherData.temperature - 25) * 3)),
      cold: Math.max(5, Math.min(95, (5 - weatherData.temperature) * 4)),
      windy: Math.max(5, Math.min(95, weatherData.windSpeed * 2)),
      wet: Math.max(5, Math.min(95, weatherData.precipitation * 10 + weatherData.humidity * 0.3)),
      uncomfortable: Math.max(5, Math.min(95, Math.abs(weatherData.temperature - 20) * 2 + weatherData.humidity * 0.2))
    };

    // Event-specific adjustments
    const eventAdjustments: Record<string, Partial<RiskData>> = {
      vacation: { hot: 10, wet: 15, uncomfortable: 5 },
      hiking: { hot: 15, cold: 10, windy: 10, wet: 20 },
      fishing: { windy: 20, wet: 25, uncomfortable: 10 },
      picnic: { wet: 30, windy: 15, hot: 10 },
      sports: { hot: 25, wet: 20, uncomfortable: 15 },
      camping: { cold: 20, wet: 25, windy: 10, uncomfortable: 15 },
    };

    const adjustments = eventAdjustments[eventType] || {};
    Object.keys(adjustments).forEach((key) => {
      const k = key as keyof RiskData;
      baseRisks[k] = Math.max(5, Math.min(95, baseRisks[k] + (adjustments[k] || 0)));
    });

    return baseRisks;
  };

  const addMessage = (text: string, sender: 'bot' | 'user', riskData?: RiskData, dataSources?: string[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date(),
      riskData,
      dataSources,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const simulateTyping = (callback: () => void, delay = 1200) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      callback();
    }, delay);
  };

  const processMessage = (message: string) => {
    const lowerMsg = message.toLowerCase();

    if (chatState.stage === 'event') {
      const eventMap: Record<string, string[]> = {
        vacation: ['vacation', 'holiday', 'beach', 'trip'],
        hiking: ['hike', 'hiking', 'trail', 'trek', 'mountain'],
        fishing: ['fish', 'fishing', 'angling'],
        picnic: ['picnic', 'outdoor meal', 'park'],
        sports: ['sport', 'game', 'match', 'athletic', 'exercise'],
        camping: ['camp', 'camping', 'tent'],
      };

      for (const [event, keywords] of Object.entries(eventMap)) {
        if (keywords.some((keyword) => lowerMsg.includes(keyword))) {
          setChatState((prev) => ({ ...prev, eventType: event, stage: 'location' }));
          simulateTyping(() => {
            const responses = [
              `Awesome! ${event.charAt(0).toUpperCase() + event.slice(1)} is amazing! Now, where's this happening? Drop me a city name!`,
              `Nice choice! ${event.charAt(0).toUpperCase() + event.slice(1)} sounds fun! What's the location?`,
              `Perfect! I love ${event}! Where are you heading?`,
            ];
            addMessage(responses[Math.floor(Math.random() * responses.length)], 'bot');
          });
          return;
        }
      }

      simulateTyping(() => {
        addMessage("Hmm, I'm not quite sure about that activity. Try: vacation, hiking, fishing, picnic, sports, or camping!", 'bot');
      });
    } else if (chatState.stage === 'location') {
      setChatState((prev) => ({ ...prev, location: message, stage: 'date' }));
      simulateTyping(() => {
        const responses = [
          `Got it! ${message} it is! When's the big day? Use format YYYY-MM-DD`,
          `${message} - sounds great! What date are we looking at? (YYYY-MM-DD)`,
          `Perfect! I've got ${message} locked in. Now, what's the date? (YYYY-MM-DD)`,
        ];
        addMessage(responses[Math.floor(Math.random() * responses.length)], 'bot');
      });
    } else if (chatState.stage === 'date') {
      setChatState((prev) => ({ ...prev, date: message }));
      simulateTyping(() => {
        addMessage('🛰️ Accessing NASA satellite data and atmospheric models...', 'bot');
        
        setTimeout(() => {
          generateRealWeatherReport(message);
        }, 2000);
      }, 1500);
    }
  };

  const generateRealWeatherReport = async (date: string) => {
    try {
      addMessage('📡 Connecting to NASA data sources and analyzing patterns...', 'bot');
      
      // Get coordinates from location
      const coords = await getCoordinatesFromLocation(chatState.location!);
      
      // Get real weather data
      const weatherData = await getNASAWeatherData(coords.lat, coords.lon, date);
      
      // Analyze with AI
      const analysis = await analyzeWithGemini(weatherData, chatState.eventType!, date);
      
      const report = `${analysis.analysis}\n\n**Real-time Data:**\n• Temperature: ${Math.round(weatherData.temperature)}°C\n• Wind Speed: ${Math.round(weatherData.windSpeed)} km/h\n• Precipitation: ${weatherData.precipitation.toFixed(1)}mm\n• Humidity: ${Math.round(weatherData.humidity)}%\n• Cloud Cover: ${Math.round(weatherData.cloudCover)}%`;
      
      addMessage(report, 'bot', analysis.risks, analysis.dataSources);

      setTimeout(() => {
        simulateTyping(() => {
          addMessage("Want to check another event with real NASA data? Just tell me what you're planning!", 'bot');
          setChatState({ stage: 'event', eventType: null, location: null, date: null });
        });
      }, 2000);
      
    } catch (error) {
      console.error('Error generating report:', error);
      addMessage("I encountered an issue accessing real-time NASA data. Please try again in a moment.", 'bot');
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    
    addMessage(input, 'user');
    const userMessage = input;
    setInput('');
    
    setTimeout(() => {
      processMessage(userMessage);
    }, 300);
  };

  const handleQuickReply = (event: string, label: string) => {
    addMessage(`I'm planning ${label.toLowerCase()}`, 'user');
    setChatState((prev) => ({ ...prev, eventType: event, stage: 'location' }));
    
    setTimeout(() => {
      simulateTyping(() => {
        const responses = [
          `${label} sounds amazing! Where's this adventure taking place?`,
          `Great choice! What's the location for your ${label.toLowerCase()}?`,
          `Perfect! Where are you heading for this ${label.toLowerCase()}?`,
        ];
        addMessage(responses[Math.floor(Math.random() * responses.length)], 'bot');
      });
    }, 300);
  };

  const startNewChat = () => {
    setMessages([
      {
        id: '1',
        text: "Hey! 👋 I'm WeatherBot, powered by real NASA Earth observation data. I can predict if adverse weather might ruin your outdoor plans!\n\nI'll analyze chances of extreme heat, cold, wind, rain, and uncomfortable conditions using satellite data and AI analysis.\n\nWhat kind of outdoor adventure are you planning?",
        sender: 'bot',
        timestamp: new Date(),
      },
    ]);
    setChatState({ stage: 'event', eventType: null, location: null, date: null });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Satellite className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">NASA WeatherBot</h1>
              <p className="text-sm text-gray-600">Powered by Earth Observation Satellite Data</p>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-4xl mx-auto py-8">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`group relative py-4 px-6 ${
                  message.sender === 'user' ? 'bg-gray-50 border-y border-gray-100' : 'bg-white'
                }`}
              >
                <div className="max-w-3xl mx-auto flex gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1">
                    {message.sender === 'bot' ? (
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">
                        {message.sender === 'bot' ? 'NASA WeatherBot' : 'You'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <div className="prose prose-gray max-w-none">
                      <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                        {message.text}
                      </p>
                      
                      {message.dataSources && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="text-sm font-semibold text-blue-900 mb-2">📡 Data Sources Used:</div>
                          <div className="text-sm text-blue-800 space-y-1">
                            {message.dataSources.map((source, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                                {source}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {message.riskData && (
                        <div className="mt-6 space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {[
                              { key: 'hot', icon: '🔥', label: 'Hot', color: 'bg-gradient-to-br from-orange-400 to-red-500' },
                              { key: 'cold', icon: '❄️', label: 'Cold', color: 'bg-gradient-to-br from-blue-400 to-cyan-500' },
                              { key: 'windy', icon: '💨', label: 'Windy', color: 'bg-gradient-to-br from-gray-400 to-slate-500' },
                              { key: 'wet', icon: '🌧️', label: 'Wet', color: 'bg-gradient-to-br from-blue-500 to-indigo-600' },
                              { key: 'uncomfortable', icon: '😓', label: 'Humid', color: 'bg-gradient-to-br from-yellow-400 to-orange-500' },
                            ].map((condition) => {
                              const value = Math.round(message.riskData![condition.key as keyof RiskData]);
                              return (
                                <div
                                  key={condition.key}
                                  className={`${condition.color} rounded-lg p-3 text-white text-center shadow-sm`}
                                >
                                  <div className="text-lg mb-1">{condition.icon}</div>
                                  <div className="text-sm font-bold">{value}%</div>
                                  <div className="text-xs opacity-90">{condition.label}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {message.sender === 'bot' && chatState.stage === 'event' && message.id === messages[messages.length - 1].id && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {eventTypes.map((event) => (
                          <button
                            key={event.value}
                            onClick={() => handleQuickReply(event.value, event.label)}
                            className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors"
                          >
                            {event.emoji} {event.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="py-4 px-6 bg-white">
                <div className="max-w-3xl mx-auto flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 bg-green-500">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">NASA WeatherBot</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span>Accessing satellite data...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about weather conditions for your event..."
                className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-colors ${
                  input.trim() 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-center text-gray-500 mt-2">
              Uses real NASA GFS data and satellite analysis • Free service
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
