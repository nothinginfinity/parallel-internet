// Parallel Internet - LLM Token Tracking Dashboard with 3D Globe
// Tracks API usage, costs, context windows, and performance across all major AI providers

(function() {
  'use strict';

  let scene, camera, renderer, globe, markers = [];
  let animationFrame = null;
  let initialized = false;
  let selectedProvider = null;
  let hoveredProvider = null;
  let currentFilter = 'all';
  let raycaster, mouse;
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  let globeRotation = { x: 0, y: 0 };
  let autoRotate = false; // Disabled by default - user can enable with button
  let connectionLine = null;
  let glowMeshes = [];
  let comparedProviders = [];

  // ============================================
  // DATA SOURCE (loaded from ai-companies-data.js)
  // ============================================

  // Use external AI_COMPANIES if available, otherwise fallback
  const LLM_PROVIDERS = (typeof AI_COMPANIES !== 'undefined') ? AI_COMPANIES : [
    {
      id: 'anthropic',
      name: 'Anthropic',
      logo: 'A',
      color: '#d97706',
      status: 'online',
      location: { lat: 37.7749, lon: -122.4194 },
      category: 'frontier',
      models: ['Claude 3.5 Sonnet', 'Claude 3.5 Haiku', 'Claude 3 Opus', 'Claude 3 Sonnet', 'Claude 3 Haiku'],
      pricing: { input: 3.00, output: 15.00, cachedInput: 0.30 },
      contextWindow: { reported: 200000, actual: 180000 },
      subscription: { name: 'Claude Max', price: 100, tokensIncluded: '5x Pro' },
      performance: { latency: 1.2, tokensPerSec: 85 },
      monthlyTokens: 12500000,
      trend: 'up',
      founded: '2021',
      hq: 'San Francisco, CA',
      website: 'https://claude.ai',
      docs: 'https://docs.anthropic.com',
      apiPlayground: 'https://console.anthropic.com/workbench',
      freeChat: true
    },
    {
      id: 'openai',
      name: 'OpenAI',
      logo: 'O',
      color: '#10a37f',
      status: 'online',
      location: { lat: 37.7749, lon: -122.4194 },
      category: 'frontier',
      models: ['GPT-4o', 'GPT-4 Turbo', 'GPT-4', 'GPT-3.5 Turbo', 'o1-preview', 'o1-mini'],
      pricing: { input: 2.50, output: 10.00, cachedInput: 1.25 },
      contextWindow: { reported: 128000, actual: 128000 },
      subscription: { name: 'ChatGPT Plus', price: 20, tokensIncluded: 'Unlimited chat' },
      performance: { latency: 0.8, tokensPerSec: 95 },
      monthlyTokens: 25000000,
      trend: 'stable',
      founded: '2015',
      hq: 'San Francisco, CA',
      website: 'https://chat.openai.com',
      docs: 'https://platform.openai.com/docs',
      apiPlayground: 'https://platform.openai.com/playground',
      freeChat: true
    },
    {
      id: 'google-deepmind',
      name: 'Google DeepMind',
      logo: 'G',
      color: '#4285f4',
      status: 'online',
      location: { lat: 37.4220, lon: -122.0841 },
      category: 'frontier',
      models: ['Gemini 2.0 Flash', 'Gemini 1.5 Pro', 'Gemini 1.5 Flash', 'Gemini Ultra'],
      pricing: { input: 1.25, output: 5.00, cachedInput: 0.32 },
      contextWindow: { reported: 2000000, actual: 1000000 },
      subscription: { name: 'Gemini Advanced', price: 20, tokensIncluded: 'Unlimited' },
      performance: { latency: 0.9, tokensPerSec: 120 },
      monthlyTokens: 18000000,
      trend: 'up',
      founded: '2010',
      hq: 'Mountain View, CA',
      website: 'https://gemini.google.com',
      docs: 'https://ai.google.dev/docs',
      apiPlayground: 'https://aistudio.google.com',
      freeChat: true
    },
    {
      id: 'meta-ai',
      name: 'Meta AI',
      logo: 'M',
      color: '#0668e1',
      status: 'online',
      location: { lat: 37.4848, lon: -122.1484 },
      category: 'opensource',
      models: ['Llama 3.3 70B', 'Llama 3.2 90B Vision', 'Llama 3.1 405B', 'Llama 3 8B'],
      pricing: { input: 0.00, output: 0.00, cachedInput: 0.00 },
      contextWindow: { reported: 128000, actual: 128000 },
      subscription: { name: 'Free (Open Source)', price: 0, tokensIncluded: 'Self-host' },
      performance: { latency: 1.5, tokensPerSec: 60 },
      monthlyTokens: 8000000,
      trend: 'up',
      founded: '2004',
      hq: 'Menlo Park, CA',
      website: 'https://ai.meta.com',
      docs: 'https://llama.meta.com',
      apiPlayground: null,
      freeChat: true
    },
    {
      id: 'mistral',
      name: 'Mistral AI',
      logo: 'M',
      color: '#ff7000',
      status: 'online',
      location: { lat: 48.8566, lon: 2.3522 },
      category: 'frontier',
      models: ['Mistral Large 2', 'Mistral Medium', 'Mistral Small', 'Mixtral 8x22B', 'Codestral'],
      pricing: { input: 2.00, output: 6.00, cachedInput: 0.20 },
      contextWindow: { reported: 128000, actual: 128000 },
      subscription: { name: 'Le Chat Pro', price: 15, tokensIncluded: 'Unlimited' },
      performance: { latency: 0.7, tokensPerSec: 110 },
      monthlyTokens: 5000000,
      trend: 'up',
      founded: '2023',
      hq: 'Paris, France',
      website: 'https://chat.mistral.ai',
      docs: 'https://docs.mistral.ai',
      apiPlayground: 'https://console.mistral.ai',
      freeChat: true
    },
    {
      id: 'xai',
      name: 'xAI (Grok)',
      logo: 'X',
      color: '#000000',
      status: 'online',
      location: { lat: 37.7749, lon: -122.4194 },
      category: 'frontier',
      models: ['Grok-2', 'Grok-2 mini', 'Grok-1.5'],
      pricing: { input: 2.00, output: 10.00, cachedInput: 0.00 },
      contextWindow: { reported: 128000, actual: 128000 },
      subscription: { name: 'X Premium+', price: 16, tokensIncluded: 'Unlimited' },
      performance: { latency: 1.0, tokensPerSec: 80 },
      monthlyTokens: 3500000,
      trend: 'up',
      founded: '2023',
      hq: 'Bay Area, CA',
      website: 'https://x.com',
      docs: 'https://docs.x.ai',
      apiPlayground: 'https://console.x.ai',
      freeChat: false
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      logo: 'D',
      color: '#5b6ef7',
      status: 'online',
      location: { lat: 39.9042, lon: 116.4074 },
      category: 'opensource',
      models: ['DeepSeek-V3', 'DeepSeek-R1', 'DeepSeek Coder V2', 'DeepSeek-V2.5'],
      pricing: { input: 0.14, output: 0.28, cachedInput: 0.014 },
      contextWindow: { reported: 128000, actual: 64000 },
      subscription: { name: 'API Only', price: 0, tokensIncluded: 'Pay-per-use' },
      performance: { latency: 2.0, tokensPerSec: 50 },
      monthlyTokens: 15000000,
      trend: 'up',
      founded: '2023',
      hq: 'Beijing, China',
      website: 'https://chat.deepseek.com',
      docs: 'https://platform.deepseek.com/docs',
      apiPlayground: 'https://platform.deepseek.com/playground',
      freeChat: true
    },
    {
      id: 'cohere',
      name: 'Cohere',
      logo: 'C',
      color: '#39594d',
      status: 'online',
      location: { lat: 43.6532, lon: -79.3832 },
      category: 'enterprise',
      models: ['Command R+', 'Command R', 'Command', 'Embed v3'],
      pricing: { input: 0.50, output: 1.50, cachedInput: 0.10 },
      contextWindow: { reported: 128000, actual: 128000 },
      subscription: { name: 'Enterprise', price: 0, tokensIncluded: 'Custom' },
      performance: { latency: 1.1, tokensPerSec: 70 },
      monthlyTokens: 4000000,
      trend: 'stable',
      founded: '2019',
      hq: 'Toronto, Canada',
      website: 'https://coral.cohere.com',
      docs: 'https://docs.cohere.com',
      apiPlayground: 'https://dashboard.cohere.com/playground',
      freeChat: true
    },
    {
      id: 'groq',
      name: 'Groq',
      logo: 'G',
      color: '#f55036',
      status: 'online',
      location: { lat: 37.5485, lon: -121.9886 },
      category: 'inference',
      models: ['Llama 3.3 70B', 'Llama 3.2 90B Vision', 'Mixtral 8x7B', 'Gemma 2 9B'],
      pricing: { input: 0.05, output: 0.08, cachedInput: 0.00 },
      contextWindow: { reported: 128000, actual: 128000 },
      subscription: { name: 'Free Tier', price: 0, tokensIncluded: '14.4K req/day' },
      performance: { latency: 0.2, tokensPerSec: 750 },
      monthlyTokens: 20000000,
      trend: 'up',
      founded: '2016',
      hq: 'Mountain View, CA',
      website: 'https://groq.com',
      docs: 'https://console.groq.com/docs',
      apiPlayground: 'https://console.groq.com/playground',
      freeChat: true
    },
    {
      id: 'cerebras',
      name: 'Cerebras',
      logo: 'C',
      color: '#00d4aa',
      status: 'online',
      location: { lat: 37.4419, lon: -122.1430 },
      category: 'inference',
      models: ['Llama 3.3 70B', 'Llama 3.1 70B', 'Llama 3.1 8B'],
      pricing: { input: 0.10, output: 0.10, cachedInput: 0.00 },
      contextWindow: { reported: 128000, actual: 128000 },
      subscription: { name: 'Free Tier', price: 0, tokensIncluded: '30 req/min' },
      performance: { latency: 0.1, tokensPerSec: 2100 },
      monthlyTokens: 8000000,
      trend: 'up',
      founded: '2016',
      hq: 'Sunnyvale, CA',
      website: 'https://cerebras.ai',
      docs: 'https://inference-docs.cerebras.ai',
      apiPlayground: 'https://inference.cerebras.ai',
      freeChat: true
    },
    {
      id: 'sambanova',
      name: 'SambaNova',
      logo: 'S',
      color: '#ff6b35',
      status: 'online',
      location: { lat: 37.4419, lon: -122.1430 },
      category: 'inference',
      models: ['Llama 3.3 70B', 'Llama 3.2 11B Vision', 'Llama 3.1 405B'],
      pricing: { input: 0.10, output: 0.20, cachedInput: 0.00 },
      contextWindow: { reported: 128000, actual: 128000 },
      subscription: { name: 'Free Tier', price: 0, tokensIncluded: 'Limited' },
      performance: { latency: 0.3, tokensPerSec: 400 },
      monthlyTokens: 3000000,
      trend: 'up',
      founded: '2017',
      hq: 'Palo Alto, CA',
      website: 'https://sambanova.ai',
      docs: 'https://community.sambanova.ai/docs',
      apiPlayground: 'https://cloud.sambanova.ai',
      freeChat: true
    },
    {
      id: 'together',
      name: 'Together AI',
      logo: 'T',
      color: '#0ea5e9',
      status: 'online',
      location: { lat: 37.7749, lon: -122.4194 },
      category: 'inference',
      models: ['Llama 3.3 70B', 'Qwen 2.5 72B', 'Mixtral 8x22B', 'DeepSeek V3'],
      pricing: { input: 0.88, output: 0.88, cachedInput: 0.00 },
      contextWindow: { reported: 128000, actual: 128000 },
      subscription: { name: 'Free Tier', price: 0, tokensIncluded: '$1 credit' },
      performance: { latency: 0.5, tokensPerSec: 150 },
      monthlyTokens: 6000000,
      trend: 'stable',
      founded: '2022',
      hq: 'San Francisco, CA',
      website: 'https://together.ai',
      docs: 'https://docs.together.ai',
      apiPlayground: 'https://api.together.ai/playground',
      freeChat: true
    },
    {
      id: 'fireworks',
      name: 'Fireworks AI',
      logo: 'F',
      color: '#f97316',
      status: 'online',
      location: { lat: 37.5630, lon: -122.3255 },
      category: 'inference',
      models: ['Llama 3.3 70B', 'Qwen 2.5 72B', 'Mixtral MoE', 'FireFunction V2'],
      pricing: { input: 0.90, output: 0.90, cachedInput: 0.00 },
      contextWindow: { reported: 128000, actual: 128000 },
      subscription: { name: 'Free Tier', price: 0, tokensIncluded: '$1 credit' },
      performance: { latency: 0.4, tokensPerSec: 200 },
      monthlyTokens: 4500000,
      trend: 'stable',
      founded: '2022',
      hq: 'Redwood City, CA',
      website: 'https://fireworks.ai',
      docs: 'https://docs.fireworks.ai',
      apiPlayground: 'https://fireworks.ai/models',
      freeChat: false
    },
    {
      id: 'amazon-bedrock',
      name: 'Amazon Bedrock',
      logo: 'A',
      color: '#ff9900',
      status: 'online',
      location: { lat: 47.6062, lon: -122.3321 },
      category: 'cloud',
      models: ['Claude 3.5 Sonnet', 'Llama 3.2', 'Mistral Large', 'Titan', 'Nova'],
      pricing: { input: 3.00, output: 15.00, cachedInput: 0.30 },
      contextWindow: { reported: 200000, actual: 200000 },
      subscription: { name: 'AWS Pricing', price: 0, tokensIncluded: 'Pay-per-use' },
      performance: { latency: 1.5, tokensPerSec: 75 },
      monthlyTokens: 10000000,
      trend: 'stable',
      founded: '2023',
      hq: 'Seattle, WA',
      website: 'https://aws.amazon.com/bedrock',
      docs: 'https://docs.aws.amazon.com/bedrock',
      apiPlayground: 'https://console.aws.amazon.com/bedrock',
      freeChat: false
    },
    {
      id: 'azure-openai',
      name: 'Azure OpenAI',
      logo: 'A',
      color: '#0078d4',
      status: 'online',
      location: { lat: 47.6062, lon: -122.3321 },
      category: 'cloud',
      models: ['GPT-4o', 'GPT-4 Turbo', 'GPT-4', 'GPT-3.5 Turbo'],
      pricing: { input: 2.50, output: 10.00, cachedInput: 1.25 },
      contextWindow: { reported: 128000, actual: 128000 },
      subscription: { name: 'Azure Pricing', price: 0, tokensIncluded: 'Pay-per-use' },
      performance: { latency: 1.0, tokensPerSec: 90 },
      monthlyTokens: 15000000,
      trend: 'stable',
      founded: '2023',
      hq: 'Redmond, WA',
      website: 'https://azure.microsoft.com/products/ai-services/openai-service',
      docs: 'https://learn.microsoft.com/azure/ai-services/openai',
      apiPlayground: 'https://oai.azure.com/portal',
      freeChat: false
    },
    {
      id: 'google-vertex',
      name: 'Google Vertex AI',
      logo: 'V',
      color: '#34a853',
      status: 'online',
      location: { lat: 37.4220, lon: -122.0841 },
      category: 'cloud',
      models: ['Gemini 1.5 Pro', 'Gemini 1.5 Flash', 'Claude 3.5 Sonnet', 'Llama 3.1'],
      pricing: { input: 1.25, output: 5.00, cachedInput: 0.32 },
      contextWindow: { reported: 2000000, actual: 1000000 },
      subscription: { name: 'GCP Pricing', price: 0, tokensIncluded: 'Pay-per-use' },
      performance: { latency: 1.0, tokensPerSec: 100 },
      monthlyTokens: 8000000,
      trend: 'stable',
      founded: '2021',
      hq: 'Mountain View, CA',
      website: 'https://cloud.google.com/vertex-ai',
      docs: 'https://cloud.google.com/vertex-ai/docs',
      apiPlayground: 'https://console.cloud.google.com/vertex-ai',
      freeChat: false
    },
    {
      id: 'perplexity',
      name: 'Perplexity AI',
      logo: 'P',
      color: '#20808d',
      status: 'online',
      location: { lat: 37.7749, lon: -122.4194 },
      category: 'search',
      models: ['Sonar Large', 'Sonar Small', 'Sonar Pro'],
      pricing: { input: 1.00, output: 1.00, cachedInput: 0.00 },
      contextWindow: { reported: 128000, actual: 128000 },
      subscription: { name: 'Perplexity Pro', price: 20, tokensIncluded: '600+ Pro/day' },
      performance: { latency: 1.5, tokensPerSec: 60 },
      monthlyTokens: 5000000,
      trend: 'up',
      founded: '2022',
      hq: 'San Francisco, CA',
      website: 'https://perplexity.ai',
      docs: 'https://docs.perplexity.ai',
      apiPlayground: null,
      freeChat: true
    },
    {
      id: 'openrouter',
      name: 'OpenRouter',
      logo: 'R',
      color: '#6366f1',
      status: 'online',
      location: { lat: 37.7749, lon: -122.4194 },
      category: 'aggregator',
      models: ['All Major Models', 'Claude', 'GPT-4', 'Llama', 'Mistral'],
      pricing: { input: 0.00, output: 0.00, cachedInput: 0.00 },
      contextWindow: { reported: 200000, actual: 200000 },
      subscription: { name: 'Pay-per-use', price: 0, tokensIncluded: 'Model-specific' },
      performance: { latency: 1.2, tokensPerSec: 80 },
      monthlyTokens: 10000000,
      trend: 'up',
      founded: '2023',
      hq: 'San Francisco, CA',
      website: 'https://openrouter.ai',
      docs: 'https://openrouter.ai/docs',
      apiPlayground: 'https://openrouter.ai/playground',
      freeChat: false
    },
    {
      id: 'huggingface',
      name: 'Hugging Face',
      logo: 'H',
      color: '#ffbd45',
      status: 'online',
      location: { lat: 40.7128, lon: -74.0060 },
      category: 'platform',
      models: ['Inference API', 'All Open Models', 'Spaces'],
      pricing: { input: 0.00, output: 0.00, cachedInput: 0.00 },
      contextWindow: { reported: 128000, actual: 32000 },
      subscription: { name: 'Pro', price: 9, tokensIncluded: 'Enhanced inference' },
      performance: { latency: 2.0, tokensPerSec: 40 },
      monthlyTokens: 2000000,
      trend: 'stable',
      founded: '2016',
      hq: 'New York, NY',
      website: 'https://huggingface.co',
      docs: 'https://huggingface.co/docs',
      apiPlayground: 'https://huggingface.co/spaces',
      freeChat: true
    },
    {
      id: 'replicate',
      name: 'Replicate',
      logo: 'R',
      color: '#262626',
      status: 'online',
      location: { lat: 37.7749, lon: -122.4194 },
      category: 'platform',
      models: ['Llama', 'Stable Diffusion', 'Whisper', 'Custom Models'],
      pricing: { input: 0.00, output: 0.00, cachedInput: 0.00 },
      contextWindow: { reported: 32000, actual: 32000 },
      subscription: { name: 'Pay-per-run', price: 0, tokensIncluded: 'Model-specific' },
      performance: { latency: 3.0, tokensPerSec: 30 },
      monthlyTokens: 1500000,
      trend: 'stable',
      founded: '2019',
      hq: 'San Francisco, CA',
      website: 'https://replicate.com',
      docs: 'https://replicate.com/docs',
      apiPlayground: 'https://replicate.com/explore',
      freeChat: false
    },
    {
      id: 'ai21',
      name: 'AI21 Labs',
      logo: '21',
      color: '#2563eb',
      status: 'online',
      location: { lat: 32.0853, lon: 34.7818 },
      category: 'enterprise',
      models: ['Jamba 1.5 Large', 'Jamba 1.5 Mini', 'Jurassic-2'],
      pricing: { input: 0.50, output: 0.70, cachedInput: 0.00 },
      contextWindow: { reported: 256000, actual: 256000 },
      subscription: { name: 'Enterprise', price: 0, tokensIncluded: 'Custom' },
      performance: { latency: 1.3, tokensPerSec: 65 },
      monthlyTokens: 2000000,
      trend: 'stable',
      founded: '2017',
      hq: 'Tel Aviv, Israel',
      website: 'https://ai21.com',
      docs: 'https://docs.ai21.com',
      apiPlayground: 'https://studio.ai21.com',
      freeChat: false
    },
    {
      id: 'aleph-alpha',
      name: 'Aleph Alpha',
      logo: 'AA',
      color: '#1e3a5f',
      status: 'online',
      location: { lat: 49.4875, lon: 8.4660 },
      category: 'enterprise',
      models: ['Luminous Supreme', 'Luminous Extended', 'Luminous Base'],
      pricing: { input: 0.60, output: 0.70, cachedInput: 0.00 },
      contextWindow: { reported: 64000, actual: 64000 },
      subscription: { name: 'Enterprise', price: 0, tokensIncluded: 'Custom' },
      performance: { latency: 1.5, tokensPerSec: 55 },
      monthlyTokens: 1000000,
      trend: 'stable',
      founded: '2019',
      hq: 'Heidelberg, Germany',
      website: 'https://aleph-alpha.com',
      docs: 'https://docs.aleph-alpha.com',
      apiPlayground: 'https://app.aleph-alpha.com',
      freeChat: false
    },
    {
      id: 'inflection',
      name: 'Inflection AI',
      logo: 'Pi',
      color: '#ff6b6b',
      status: 'online',
      location: { lat: 37.4419, lon: -122.1430 },
      category: 'consumer',
      models: ['Pi', 'Inflection 2.5'],
      pricing: { input: 0.00, output: 0.00, cachedInput: 0.00 },
      contextWindow: { reported: 32000, actual: 32000 },
      subscription: { name: 'Free', price: 0, tokensIncluded: 'Unlimited chat' },
      performance: { latency: 0.8, tokensPerSec: 90 },
      monthlyTokens: 500000,
      trend: 'down',
      founded: '2022',
      hq: 'Palo Alto, CA',
      website: 'https://pi.ai',
      docs: null,
      apiPlayground: null,
      freeChat: true
    },
    {
      id: 'reka',
      name: 'Reka AI',
      logo: 'R',
      color: '#8b5cf6',
      status: 'online',
      location: { lat: 37.7749, lon: -122.4194 },
      category: 'frontier',
      models: ['Reka Core', 'Reka Flash', 'Reka Edge'],
      pricing: { input: 0.40, output: 1.00, cachedInput: 0.00 },
      contextWindow: { reported: 128000, actual: 128000 },
      subscription: { name: 'API Only', price: 0, tokensIncluded: 'Pay-per-use' },
      performance: { latency: 1.0, tokensPerSec: 70 },
      monthlyTokens: 800000,
      trend: 'up',
      founded: '2023',
      hq: 'San Francisco, CA',
      website: 'https://reka.ai',
      docs: 'https://docs.reka.ai',
      apiPlayground: 'https://chat.reka.ai',
      freeChat: true
    },
    {
      id: 'alibaba-qwen',
      name: 'Alibaba Qwen',
      logo: 'Q',
      color: '#ff6a00',
      status: 'online',
      location: { lat: 30.2741, lon: 120.1551 },
      category: 'opensource',
      models: ['Qwen 2.5 72B', 'Qwen 2.5 32B', 'Qwen 2.5 Coder', 'QwQ'],
      pricing: { input: 0.40, output: 1.20, cachedInput: 0.00 },
      contextWindow: { reported: 128000, actual: 128000 },
      subscription: { name: 'Free (Open Source)', price: 0, tokensIncluded: 'Self-host' },
      performance: { latency: 1.2, tokensPerSec: 85 },
      monthlyTokens: 6000000,
      trend: 'up',
      founded: '2023',
      hq: 'Hangzhou, China',
      website: 'https://qwenlm.github.io',
      docs: 'https://qwen.readthedocs.io',
      apiPlayground: 'https://huggingface.co/spaces/Qwen/Qwen2.5',
      freeChat: true
    },
    {
      id: 'nvidia-nim',
      name: 'NVIDIA NIM',
      logo: 'N',
      color: '#76b900',
      status: 'online',
      location: { lat: 37.3861, lon: -122.0839 },
      category: 'inference',
      models: ['Llama 3.3 70B', 'Nemotron-70B', 'Mixtral 8x22B'],
      pricing: { input: 0.00, output: 0.00, cachedInput: 0.00 },
      contextWindow: { reported: 128000, actual: 128000 },
      subscription: { name: 'Free Tier', price: 0, tokensIncluded: '5000 API calls' },
      performance: { latency: 0.4, tokensPerSec: 300 },
      monthlyTokens: 4000000,
      trend: 'up',
      founded: '2024',
      hq: 'Santa Clara, CA',
      website: 'https://build.nvidia.com',
      docs: 'https://docs.nvidia.com/nim',
      apiPlayground: 'https://build.nvidia.com/explore/discover',
      freeChat: true
    }
  ];

  // ============================================
  // INITIALIZATION
  // ============================================

  function init() {
    if (initialized) return;
    initialized = true;

    // Render UI first for immediate feedback
    renderProvidersList();
    renderLiveTicker();
    renderPerformanceChart();
    updateFilterCount();

    // Defer globe init so UI appears instantly
    setTimeout(() => {
      const container = document.getElementById('globe-canvas-container');
      if (container) {
        if (typeof THREE !== 'undefined') {
          initThreeJS();
          animate();
        } else {
          initFallbackGlobe();
        }
      }
    }, 50);

    // Update ticker periodically
    setInterval(() => {
      renderLiveTicker();
    }, 5000);

    // Initialize embedded chat widget
    initChat();
  }

  // ============================================
  // THREE.JS GLOBE
  // ============================================

  function initThreeJS() {
    const container = document.getElementById('globe-canvas-container');
    if (!container) return;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 3;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Globe with shader-based grid (faster than separate meshes)
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const globeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec3 vNormal;
        varying vec2 vUv;
        varying vec3 vPosition;

        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          vec3 atmosphere = vec3(0.3, 0.6, 1.0) * intensity;
          vec3 base = vec3(0.03, 0.03, 0.08);

          // Grid lines
          float latLines = smoothstep(0.02, 0.0, abs(fract(vUv.y * 12.0) - 0.5));
          float lonLines = smoothstep(0.02, 0.0, abs(fract(vUv.x * 24.0) - 0.5));
          vec3 grid = vec3(0.1, 0.3, 0.5) * max(latLines, lonLines) * 0.4;

          // Subtle continent shapes (noise-based)
          float noise = sin(vPosition.x * 8.0) * sin(vPosition.y * 8.0) * sin(vPosition.z * 8.0);
          vec3 land = vec3(0.05, 0.1, 0.15) * smoothstep(0.0, 0.3, noise);

          gl_FragColor = vec4(base + atmosphere + grid + land, 1.0);
        }
      `,
      transparent: true
    });

    globe = new THREE.Mesh(geometry, globeMaterial);
    scene.add(globe);

    // Outer atmosphere glow
    const atmosphereGeometry = new THREE.SphereGeometry(1.15, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.5 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity * 0.4;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });

    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // Add provider markers
    addProviderMarkers();

    // Setup interactions
    setupInteractions();

    // Window resize
    window.addEventListener('resize', onWindowResize);

    // Hide loading spinner
    const loadingEl = document.querySelector('.globe-loading');
    if (loadingEl) {
      loadingEl.style.display = 'none';
    }
  }

  function addProviderMarkers() {
    LLM_PROVIDERS.forEach(provider => {
      // Marker
      const markerGeometry = new THREE.SphereGeometry(0.025, 16, 16);
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(provider.color),
        transparent: true,
        opacity: 0.9
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);

      // Glow
      const glowGeometry = new THREE.SphereGeometry(0.04, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(provider.color),
        transparent: true,
        opacity: 0.3
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);

      // Convert lat/lon to 3D position
      const pos = latLonToVector3(provider.location.lat, provider.location.lon, 1.02);
      marker.position.copy(pos);
      glow.position.copy(pos);

      marker.userData = provider;
      glow.userData = { isGlow: true, providerId: provider.id };

      globe.add(marker);
      globe.add(glow);

      markers.push(marker);
      glowMeshes.push(glow);
    });
  }

  function animate() {
    animationFrame = requestAnimationFrame(animate);

    if (globe && autoRotate) {
      globe.rotation.y += 0.001;
    }

    // Pulse glow effect
    const time = Date.now() * 0.001;
    glowMeshes.forEach((glow, i) => {
      const scale = 1 + 0.2 * Math.sin(time * 2 + i * 0.5);
      glow.scale.setScalar(scale);
    });

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  function setupInteractions() {
    const canvas = renderer.domElement;

    // Mouse move
    canvas.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const deltaX = event.clientX - previousMousePosition.x;
        const deltaY = event.clientY - previousMousePosition.y;

        if (globe) {
          globe.rotation.y += deltaX * 0.005;
          globe.rotation.x += deltaY * 0.005;
          globe.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, globe.rotation.x));
        }

        previousMousePosition = { x: event.clientX, y: event.clientY };
      } else {
        checkHover(event);
      }
    });

    // Mouse down
    canvas.addEventListener('mousedown', (event) => {
      isDragging = true;
      autoRotate = false;
      previousMousePosition = { x: event.clientX, y: event.clientY };
      canvas.style.cursor = 'grabbing';
    });

    // Mouse up
    canvas.addEventListener('mouseup', () => {
      isDragging = false;
      canvas.style.cursor = 'grab';
      setTimeout(() => {
        if (!isDragging) autoRotate = true;
      }, 3000);
    });

    // Mouse leave
    canvas.addEventListener('mouseleave', () => {
      isDragging = false;
      canvas.style.cursor = 'grab';
      hideTooltip();
    });

    // Click handler
    canvas.addEventListener('click', (event) => {
      checkClick(event);
    });

    // Double click to reset view
    canvas.addEventListener('dblclick', () => {
      if (globe) {
        globe.rotation.x = 0;
        globe.rotation.y = 0;
      }
      autoRotate = true;
    });
  }

  function checkHover(event) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(markers);

    if (intersects.length > 0) {
      const marker = intersects[0].object;
      const provider = marker.userData;

      if (hoveredProvider !== provider.id) {
        hoveredProvider = provider.id;
        showTooltip(event, provider);

        markers.forEach(m => {
          if (m.userData.id === provider.id) {
            m.scale.setScalar(1.8);
          } else if (m.userData.id !== selectedProvider) {
            m.scale.setScalar(1);
          }
        });

        // Highlight corresponding card in list
        highlightCard(provider.id);
      }

      renderer.domElement.style.cursor = 'pointer';
    } else {
      if (hoveredProvider && hoveredProvider !== selectedProvider) {
        markers.forEach(m => {
          if (m.userData.id !== selectedProvider) {
            m.scale.setScalar(1);
          }
        });
      }
      // Clear card highlight
      if (hoveredProvider) {
        unhighlightCard();
      }
      hoveredProvider = null;
      hideTooltip();
      if (!isDragging) {
        renderer.domElement.style.cursor = 'grab';
      }
    }
  }

  // Highlight globe marker when hovering card
  function highlightMarker(providerId) {
    if (!markers.length) return;
    const provider = LLM_PROVIDERS.find(p => p.id === providerId);
    if (!provider) return;

    markers.forEach(m => {
      if (m.userData.id === providerId) {
        m.scale.setScalar(1.8);
        // Pulse glow effect
        const glow = glowMeshes.find(g => g.userData.providerId === providerId);
        if (glow) {
          glow.scale.setScalar(1.5);
          glow.material.opacity = 0.6;
        }
      }
    });
  }

  // Reset marker when leaving card
  function unhighlightMarker(providerId) {
    if (!markers.length) return;
    if (providerId === selectedProvider) return; // Keep selected marker highlighted

    markers.forEach(m => {
      if (m.userData.id === providerId) {
        m.scale.setScalar(1);
        const glow = glowMeshes.find(g => g.userData.providerId === providerId);
        if (glow) {
          glow.scale.setScalar(1);
          glow.material.opacity = 0.3;
        }
      }
    });
  }

  // Highlight card in list when hovering globe marker
  function highlightCard(providerId) {
    const cards = document.querySelectorAll('.provider-card');
    cards.forEach(card => card.classList.remove('globe-hovered'));
    const card = document.querySelector(`[data-provider="${providerId}"]`);
    if (card) {
      card.classList.add('globe-hovered');
      // Scroll card into view if needed
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  // Remove card highlight
  function unhighlightCard() {
    const cards = document.querySelectorAll('.provider-card');
    cards.forEach(card => card.classList.remove('globe-hovered'));
  }

  // ============================================
  // CONNECTION LINES (RELATIONSHIPS)
  // ============================================

  let connectionLines = [];
  let connectionLabels = [];

  function drawConnectionLines(providerId) {
    clearConnectionLines();

    const provider = LLM_PROVIDERS.find(p => p.id === providerId);
    if (!provider || !provider.relationships) return;

    const sourceMarker = markers.find(m => m.userData.id === providerId);
    if (!sourceMarker) return;

    const relationships = provider.relationships;
    const allRelatedIds = new Set();

    // Collect all related company IDs
    Object.values(relationships).forEach(relArray => {
      if (Array.isArray(relArray)) {
        relArray.forEach(id => allRelatedIds.add(id));
      }
    });

    // Draw lines to each related company that exists in our data
    allRelatedIds.forEach(relatedId => {
      const relatedProvider = LLM_PROVIDERS.find(p => p.id === relatedId);
      if (!relatedProvider) return;

      const targetMarker = markers.find(m => m.userData.id === relatedId);
      if (!targetMarker) return;

      // Determine relationship type for color
      let lineColor = 0x3b82f6; // default blue
      let relType = 'connected';

      for (const [type, ids] of Object.entries(relationships)) {
        if (Array.isArray(ids) && ids.includes(relatedId)) {
          relType = type;
          switch(type) {
            case 'investors':
            case 'investors_in':
              lineColor = 0x22c55e; // green for investment
              break;
            case 'partnerships':
              lineColor = 0x3b82f6; // blue for partnerships
              break;
            case 'competes_with':
              lineColor = 0xef4444; // red for competition
              break;
            case 'integrations':
            case 'integrates_with':
              lineColor = 0xa855f7; // purple for integrations
              break;
            case 'runs_models_from':
            case 'models_used_by':
            case 'hosts_models_from':
              lineColor = 0xf59e0b; // orange for model usage
              break;
            case 'supplies_chips_to':
            case 'uses_chips_from':
              lineColor = 0x06b6d4; // cyan for hardware
              break;
            case 'acquired':
            case 'acquired_by':
              lineColor = 0xec4899; // pink for acquisitions
              break;
            default:
              lineColor = 0x6b7280; // gray for other
          }
          break;
        }
      }

      // Create curved line using QuadraticBezierCurve3
      const start = sourceMarker.position.clone();
      const end = targetMarker.position.clone();

      // Calculate midpoint and push it outward for curve
      const mid = start.clone().add(end).multiplyScalar(0.5);
      const midLength = mid.length();
      mid.normalize().multiplyScalar(midLength * 1.3); // Push out for arc

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const points = curve.getPoints(30);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      const material = new THREE.LineBasicMaterial({
        color: lineColor,
        transparent: true,
        opacity: 0.6,
        linewidth: 2
      });

      const line = new THREE.Line(geometry, material);
      line.userData = { relType, targetId: relatedId };
      scene.add(line);
      connectionLines.push(line);

      // Highlight the connected marker
      targetMarker.scale.setScalar(1.3);
    });
  }

  function clearConnectionLines() {
    connectionLines.forEach(line => {
      scene.remove(line);
      line.geometry.dispose();
      line.material.dispose();
    });
    connectionLines = [];

    // Reset marker scales
    markers.forEach(m => {
      if (m.userData.id !== selectedProvider) {
        m.scale.setScalar(1);
      }
    });
  }

  function getRelationshipSummary(provider) {
    if (!provider.relationships) return null;

    const summary = [];
    const r = provider.relationships;

    if (r.investors?.length) {
      summary.push({ type: 'Investors', ids: r.investors, color: '#22c55e' });
    }
    if (r.investors_in?.length) {
      summary.push({ type: 'Invested In', ids: r.investors_in, color: '#22c55e' });
    }
    if (r.partnerships?.length) {
      summary.push({ type: 'Partners', ids: r.partnerships, color: '#3b82f6' });
    }
    if (r.competes_with?.length) {
      summary.push({ type: 'Competitors', ids: r.competes_with, color: '#ef4444' });
    }
    if (r.integrations?.length || r.integrates_with?.length) {
      summary.push({ type: 'Integrations', ids: r.integrations || r.integrates_with, color: '#a855f7' });
    }
    if (r.runs_models_from?.length) {
      summary.push({ type: 'Runs Models From', ids: r.runs_models_from, color: '#f59e0b' });
    }
    if (r.models_used_by?.length) {
      summary.push({ type: 'Models Used By', ids: r.models_used_by, color: '#f59e0b' });
    }
    if (r.hosts_models_from?.length) {
      summary.push({ type: 'Hosts Models From', ids: r.hosts_models_from, color: '#f59e0b' });
    }
    if (r.supplies_chips_to?.length) {
      summary.push({ type: 'Supplies Chips To', ids: r.supplies_chips_to, color: '#06b6d4' });
    }
    if (r.uses_chips_from?.length) {
      summary.push({ type: 'Uses Chips From', ids: r.uses_chips_from, color: '#06b6d4' });
    }
    if (r.acquired?.length) {
      summary.push({ type: 'Acquired', ids: r.acquired, color: '#ec4899' });
    }
    if (r.acquired_by?.length) {
      summary.push({ type: 'Acquired By', ids: r.acquired_by, color: '#ec4899' });
    }
    if (r.parent?.length) {
      summary.push({ type: 'Parent Company', ids: r.parent, color: '#8b5cf6' });
    }

    return summary;
  }

  function renderRelationshipsPanel(provider) {
    const panel = document.getElementById('provider-detail-panel');
    if (!panel) return;

    const relationships = getRelationshipSummary(provider);
    if (!relationships || relationships.length === 0) return '';

    let html = `<div class="relationships-section" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
      <h4 style="font-size: 13px; font-weight: 600; margin-bottom: 12px; color: #fff;">
        🔗 Industry Connections
      </h4>`;

    relationships.forEach(rel => {
      html += `<div class="rel-group" style="margin-bottom: 12px;">
        <div style="font-size: 10px; color: ${rel.color}; font-weight: 600; margin-bottom: 6px; text-transform: uppercase;">
          ${rel.type}
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">`;

      rel.ids.forEach(id => {
        const company = LLM_PROVIDERS.find(p => p.id === id);
        const name = company ? company.name : id;
        const color = company ? company.color : '#666';

        html += `<span class="rel-chip" onclick="window.parallelInternet.selectProvider('${id}', true)"
          style="padding: 4px 10px; background: ${color}20; border: 1px solid ${color}40;
                 border-radius: 12px; font-size: 11px; cursor: pointer; color: #fff;
                 transition: all 0.2s;"
          onmouseover="this.style.background='${color}40'"
          onmouseout="this.style.background='${color}20'">
          ${name}
        </span>`;
      });

      html += `</div></div>`;
    });

    html += `</div>`;
    return html;
  }

  function checkClick(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(markers);

    if (intersects.length > 0) {
      const marker = intersects[0].object;
      const provider = marker.userData;
      selectProvider(provider.id, true);
    }
  }

  function showTooltip(event, provider) {
    const tooltip = document.getElementById('globe-tooltip');
    if (!tooltip) return;

    const trendIcon = provider.trend === 'up' ? '↑' : provider.trend === 'down' ? '↓' : '→';
    const trendColor = provider.trend === 'up' ? '#22c55e' : provider.trend === 'down' ? '#ef4444' : '#f59e0b';
    const statusColor = provider.status === 'online' ? '#22c55e' : '#ef4444';

    tooltip.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <div style="width: 28px; height: 28px; border-radius: 6px; background: ${provider.color}30;
                    color: ${provider.color}; display: flex; align-items: center; justify-content: center;
                    font-weight: bold; font-size: 12px;">${provider.logo}</div>
        <div>
          <div style="font-weight: 600;">${provider.name}</div>
          <div style="font-size: 10px; color: rgba(255,255,255,0.5);">${provider.hq}</div>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px;">
        <div><span style="color: rgba(255,255,255,0.5);">Speed:</span> <span style="color: #22c55e;">${provider.performance.tokensPerSec} tok/s</span></div>
        <div><span style="color: rgba(255,255,255,0.5);">Trend:</span> <span style="color: ${trendColor};">${trendIcon}</span></div>
        <div><span style="color: rgba(255,255,255,0.5);">Output:</span> <span style="color: #f59e0b;">$${provider.pricing.output.toFixed(2)}/M</span></div>
        <div><span style="color: rgba(255,255,255,0.5);">Status:</span> <span style="color: ${statusColor};">${provider.status}</span></div>
      </div>
      <div style="margin-top: 8px; font-size: 10px; color: rgba(255,255,255,0.4); text-align: center;">
        Click for details
      </div>
    `;

    const container = document.getElementById('globe-canvas-container');
    const containerRect = container.getBoundingClientRect();

    tooltip.style.display = 'block';
    tooltip.style.left = (event.clientX - containerRect.left + 15) + 'px';
    tooltip.style.top = (event.clientY - containerRect.top - 10) + 'px';

    const tooltipRect = tooltip.getBoundingClientRect();
    if (tooltipRect.right > containerRect.right) {
      tooltip.style.left = (event.clientX - containerRect.left - tooltipRect.width - 15) + 'px';
    }
    if (tooltipRect.bottom > containerRect.bottom) {
      tooltip.style.top = (event.clientY - containerRect.top - tooltipRect.height - 10) + 'px';
    }
  }

  function hideTooltip() {
    const tooltip = document.getElementById('globe-tooltip');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }

  function showDetailPanel(provider) {
    const panel = document.getElementById('provider-detail-panel');
    if (!panel) return;

    const trendIcon = provider.trend === 'up' ? '↑' : provider.trend === 'down' ? '↓' : '→';
    const trendColor = provider.trend === 'up' ? '#22c55e' : provider.trend === 'down' ? '#ef4444' : '#f59e0b';
    const statusColor = provider.status === 'online' ? '#22c55e' : '#ef4444';
    const contextPercent = provider.contextWindow.reported > 0 ? (provider.contextWindow.actual / provider.contextWindow.reported) * 100 : 0;

    panel.innerHTML = `
      <!-- Drag Handle -->
      <div class="panel-drag-handle" onmousedown="window.parallelInternet.startDragPanel(event)">
        <button onclick="window.parallelInternet.closeDetail()"
                style="background: none; border: none; color: rgba(255,255,255,0.5); cursor: pointer; font-size: 20px; padding: 0; margin-left: auto;">×</button>
      </div>

      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
        <div style="width: 48px; height: 48px; border-radius: 12px; background: ${provider.color}20;
                    color: ${provider.color}; display: flex; align-items: center; justify-content: center;
                    font-size: 20px; font-weight: bold; border: 2px solid ${provider.color}40;">${provider.logo}</div>
        <div>
          <div style="font-size: 18px; font-weight: 700;">${provider.name}</div>
          <div style="font-size: 11px; color: rgba(255,255,255,0.5);">Founded ${provider.founded} • ${provider.hq}</div>
        </div>
      </div>

      <!-- Social Media Links -->
      ${provider.social ? `
      <div class="social-links">
        ${provider.social.x ? `<a href="${provider.social.x}" target="_blank" class="social-link x" title="X (Twitter)">𝕏</a>` : ''}
        ${provider.social.linkedin ? `<a href="${provider.social.linkedin}" target="_blank" class="social-link linkedin" title="LinkedIn">in</a>` : ''}
        ${provider.social.github ? `<a href="${provider.social.github}" target="_blank" class="social-link github" title="GitHub">⌘</a>` : ''}
        ${provider.social.youtube ? `<a href="${provider.social.youtube}" target="_blank" class="social-link youtube" title="YouTube">▶</a>` : ''}
        ${provider.social.discord ? `<a href="${provider.social.discord}" target="_blank" class="social-link discord" title="Discord">💬</a>` : ''}
      </div>
      ` : ''}

      <!-- Status & Category -->
      <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">
        <span style="padding: 4px 10px; background: ${statusColor}20; color: ${statusColor}; border-radius: 20px; font-size: 10px; font-weight: 600; text-transform: uppercase;">${provider.status}</span>
        <span style="padding: 4px 10px; background: ${provider.color}20; color: ${provider.color}; border-radius: 20px; font-size: 10px; font-weight: 600; text-transform: uppercase;">${provider.category}</span>
        <span style="padding: 4px 10px; background: ${trendColor}20; color: ${trendColor}; border-radius: 20px; font-size: 10px; font-weight: 600;">${trendIcon} ${provider.trend}</span>
      </div>

      <!-- Models -->
      ${provider.models && provider.models.length > 0 ? `
      <div style="font-size: 11px; color: rgba(255,255,255,0.6); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Models</div>
      <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px;">
        ${provider.models.slice(0, 5).map(model => `
          <span style="padding: 4px 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; font-size: 10px;">${model}</span>
        `).join('')}
        ${provider.models.length > 5 ? `<span style="padding: 4px 8px; font-size: 10px; color: rgba(255,255,255,0.4);">+${provider.models.length - 5} more</span>` : ''}
      </div>
      ` : ''}

      <!-- Pricing Grid -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px;">
        <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; text-align: center;">
          <div style="font-size: 9px; color: rgba(255,255,255,0.5); margin-bottom: 4px;">INPUT</div>
          <div style="font-size: 14px; font-weight: 700; color: #f59e0b;">$${provider.pricing.input.toFixed(2)}</div>
          <div style="font-size: 8px; color: rgba(255,255,255,0.4);">/1M tok</div>
        </div>
        <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; text-align: center;">
          <div style="font-size: 9px; color: rgba(255,255,255,0.5); margin-bottom: 4px;">OUTPUT</div>
          <div style="font-size: 14px; font-weight: 700; color: #ef4444;">$${provider.pricing.output.toFixed(2)}</div>
          <div style="font-size: 8px; color: rgba(255,255,255,0.4);">/1M tok</div>
        </div>
        <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; text-align: center;">
          <div style="font-size: 9px; color: rgba(255,255,255,0.5); margin-bottom: 4px;">SPEED</div>
          <div style="font-size: 14px; font-weight: 700; color: #22c55e;">${provider.performance.tokensPerSec}</div>
          <div style="font-size: 8px; color: rgba(255,255,255,0.4);">tok/s</div>
        </div>
        <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; text-align: center;">
          <div style="font-size: 9px; color: rgba(255,255,255,0.5); margin-bottom: 4px;">LATENCY</div>
          <div style="font-size: 14px; font-weight: 700; color: #3b82f6;">${provider.performance.latency}s</div>
          <div style="font-size: 8px; color: rgba(255,255,255,0.4);">TTFT</div>
        </div>
      </div>

      <!-- Context Window -->
      <div style="font-size: 11px; color: rgba(255,255,255,0.6); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Context Window</div>
      <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 11px; color: rgba(255,255,255,0.5);">Reported: ${formatNumber(provider.contextWindow.reported)} tokens</span>
          <span style="font-size: 11px; color: rgba(255,255,255,0.5);">Actual: ${formatNumber(provider.contextWindow.actual)} tokens</span>
        </div>
        <div style="height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
          <div style="height: 100%; width: ${contextPercent}%; background: linear-gradient(90deg, #3b82f6, #22c55e); border-radius: 4px;"></div>
        </div>
        <div style="text-align: right; font-size: 10px; color: ${contextPercent >= 90 ? '#22c55e' : '#f59e0b'}; margin-top: 4px;">${contextPercent.toFixed(0)}% usable</div>
      </div>

      <!-- Subscription -->
      ${provider.subscription.price > 0 ? `
      <div style="background: linear-gradient(135deg, ${provider.color}15, transparent); padding: 12px; border-radius: 8px; border: 1px solid ${provider.color}20; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 600; font-size: 13px;">${provider.subscription.name}</div>
            <div style="font-size: 10px; color: rgba(255,255,255,0.5);">${provider.subscription.tokensIncluded}</div>
          </div>
          <div style="font-size: 18px; font-weight: 700; color: ${provider.color};">$${provider.subscription.price}<span style="font-size: 11px; font-weight: 400; color: rgba(255,255,255,0.5);">/mo</span></div>
        </div>
      </div>
      ` : ''}

      <!-- Quick Links -->
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <a href="${provider.website}" target="_blank" rel="noopener noreferrer"
           style="flex: 1; min-width: 80px; padding: 10px 12px; background: ${provider.color}20; border: 1px solid ${provider.color}40;
                  border-radius: 8px; color: ${provider.color}; text-decoration: none; text-align: center; font-size: 11px; font-weight: 600;
                  display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s;">
          Website
        </a>
        ${provider.docs ? `
        <a href="${provider.docs}" target="_blank" rel="noopener noreferrer"
           style="flex: 1; min-width: 80px; padding: 10px 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15);
                  border-radius: 8px; color: rgba(255,255,255,0.8); text-decoration: none; text-align: center; font-size: 11px; font-weight: 600;
                  display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s;">
          Docs
        </a>
        ` : ''}
      </div>

      <!-- Try/Playground Button -->
      <div style="margin-top: 12px;">
        ${provider.freeChat ? `
        <a href="${provider.website}" target="_blank" rel="noopener noreferrer"
           style="display: flex; width: 100%; padding: 12px; background: linear-gradient(135deg, ${provider.color}, ${provider.color}cc);
                  border: none; border-radius: 8px; color: white; font-size: 13px; font-weight: 700; cursor: pointer;
                  align-items: center; justify-content: center; gap: 8px; text-decoration: none; transition: all 0.2s;"
           onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
          Try ${provider.name} Free
        </a>
        ` : provider.apiPlayground ? `
        <a href="${provider.apiPlayground}" target="_blank" rel="noopener noreferrer"
           style="display: flex; width: 100%; padding: 12px; background: rgba(255,255,255,0.1);
                  border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 13px; font-weight: 600;
                  align-items: center; justify-content: center; gap: 8px; text-decoration: none; transition: all 0.2s;">
          API Playground
        </a>
        ` : ''}
      </div>

      <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1);">
        <div style="font-size: 10px; color: rgba(255,255,255,0.4); text-align: center;">
          Monthly Usage: <span style="color: #22c55e; font-weight: 600;">${formatNumber(provider.monthlyTokens)} tokens</span>
        </div>
      </div>

      ${renderRelationshipsPanel(provider) || ''}

      <!-- Live Feed Section -->
      <div class="live-feed-section">
        <div class="live-feed-header">
          <div class="live-feed-title">
            <span class="live-dot"></span>
            Live Feed
          </div>
          <div class="feed-tabs">
            <button class="feed-tab active" data-feed="all">All</button>
            <button class="feed-tab" data-feed="hn">HN</button>
            <button class="feed-tab" data-feed="x">X</button>
            <button class="feed-tab" data-feed="arxiv">arXiv</button>
          </div>
        </div>
        <div class="feed-items" id="feed-items-${provider.id}">
          <div class="feed-loading">Loading feed...</div>
        </div>
      </div>
    `;

    panel.style.display = 'block';

    // Initialize draggable
    initDraggablePanel(panel);

    // Load live feed
    loadLiveFeed(provider);
  }

  // ============================================
  // DRAGGABLE PANEL
  // ============================================

  let panelDragState = { isDragging: false, startX: 0, startY: 0, startLeft: 0, startTop: 0 };

  function initDraggablePanel(panel) {
    // Reset position to default
    panel.style.position = 'absolute';
    panel.style.right = '16px';
    panel.style.top = '16px';
    panel.style.left = 'auto';
  }

  function startDragPanel(event) {
    const panel = document.getElementById('provider-detail-panel');
    if (!panel) return;

    panelDragState.isDragging = true;
    panelDragState.startX = event.clientX;
    panelDragState.startY = event.clientY;

    const rect = panel.getBoundingClientRect();
    panelDragState.startLeft = rect.left;
    panelDragState.startTop = rect.top;

    panel.classList.add('dragging');
    panel.style.right = 'auto';
    panel.style.left = rect.left + 'px';
    panel.style.top = rect.top + 'px';

    document.addEventListener('mousemove', dragPanel);
    document.addEventListener('mouseup', stopDragPanel);
  }

  function dragPanel(event) {
    if (!panelDragState.isDragging) return;

    const panel = document.getElementById('provider-detail-panel');
    if (!panel) return;

    const deltaX = event.clientX - panelDragState.startX;
    const deltaY = event.clientY - panelDragState.startY;

    panel.style.left = (panelDragState.startLeft + deltaX) + 'px';
    panel.style.top = (panelDragState.startTop + deltaY) + 'px';
  }

  function stopDragPanel() {
    panelDragState.isDragging = false;
    const panel = document.getElementById('provider-detail-panel');
    if (panel) {
      panel.classList.remove('dragging');
    }
    document.removeEventListener('mousemove', dragPanel);
    document.removeEventListener('mouseup', stopDragPanel);
  }

  // ============================================
  // LIVE FEED
  // ============================================

  async function loadLiveFeed(provider) {
    const container = document.getElementById(`feed-items-${provider.id}`);
    if (!container) return;

    // Search terms for the company
    const searchTerms = [provider.name, provider.id].filter(Boolean);

    // Generate mock feed data (in production, these would be real API calls)
    const feedItems = await fetchFeedData(searchTerms, provider);

    if (feedItems.length === 0) {
      container.innerHTML = '<div class="feed-loading">No recent news found</div>';
      return;
    }

    container.innerHTML = feedItems.map(item => `
      <div class="feed-item" onclick="window.open('${item.url}', '_blank')">
        <div class="feed-item-header">
          <span class="feed-source ${item.source}">${item.source.toUpperCase()}</span>
          <span class="feed-time">${item.time}</span>
        </div>
        <div class="feed-item-title">${item.title}</div>
        ${item.meta ? `<div class="feed-item-meta">${item.meta}</div>` : ''}
      </div>
    `).join('');
  }

  async function fetchFeedData(searchTerms, provider) {
    // Mock data - in production this would call real APIs
    const mockFeeds = {
      'anthropic': [
        { source: 'hn', title: 'Claude 3.5 Sonnet achieves new SOTA on SWE-bench', time: '2h ago', url: 'https://news.ycombinator.com', meta: '234 points • 89 comments' },
        { source: 'x', title: '@AnthropicAI: Introducing extended thinking for Claude...', time: '5h ago', url: 'https://x.com/AnthropicAI', meta: '1.2K likes' },
        { source: 'arxiv', title: 'Constitutional AI: A Framework for Harmless AI Systems', time: '1d ago', url: 'https://arxiv.org', meta: 'cs.AI • 45 citations' }
      ],
      'openai': [
        { source: 'news', title: 'OpenAI launches GPT-4o with multimodal capabilities', time: '3h ago', url: 'https://openai.com/blog', meta: '' },
        { source: 'hn', title: 'Show HN: I built a GPT-4o powered code review tool', time: '6h ago', url: 'https://news.ycombinator.com', meta: '156 points • 42 comments' },
        { source: 'x', title: '@OpenAI: Sora is now available to Plus subscribers...', time: '1d ago', url: 'https://x.com/OpenAI', meta: '5.4K likes' }
      ],
      'google-deepmind': [
        { source: 'arxiv', title: 'Gemini: A Family of Highly Capable Multimodal Models', time: '1w ago', url: 'https://arxiv.org', meta: 'cs.AI • 128 citations' },
        { source: 'news', title: 'DeepMind AlphaFold predicts high-res protein structures', time: '2d ago', url: 'https://deepmind.com', meta: '' }
      ],
      'nvidia': [
        { source: 'hn', title: 'NVIDIA announces Blackwell B200 GPU architecture', time: '1d ago', url: 'https://news.ycombinator.com', meta: '567 points • 234 comments' },
        { source: 'news', title: 'NVIDIA market cap surpasses $3T milestone', time: '3d ago', url: 'https://nvidia.com', meta: '' }
      ],
      'meta-ai': [
        { source: 'hn', title: 'Llama 3.3 70B released with improved reasoning', time: '4h ago', url: 'https://news.ycombinator.com', meta: '423 points • 156 comments' },
        { source: 'x', title: '@AIatMeta: Open-sourcing our latest multimodal model...', time: '1d ago', url: 'https://x.com/AIatMeta', meta: '3.2K likes' }
      ]
    };

    // Return mock data or generate generic feed
    if (mockFeeds[provider.id]) {
      return mockFeeds[provider.id];
    }

    // Generic feed for companies without specific mock data
    return [
      { source: 'news', title: `Latest updates from ${provider.name}`, time: 'Recently', url: provider.website || '#', meta: '' },
      { source: 'hn', title: `Discussion: ${provider.name} in the AI landscape`, time: '1w ago', url: 'https://news.ycombinator.com', meta: '45 points' }
    ];
  }

  function hideDetailPanel() {
    const panel = document.getElementById('provider-detail-panel');
    if (panel) {
      panel.style.display = 'none';
      panel.innerHTML = '';
    }
    removeConnectionLine();
  }

  function drawConnectionLine(provider) {
    removeConnectionLine();
    // Connection line implementation would go here
  }

  function removeConnectionLine() {
    if (connectionLine && globe) {
      globe.remove(connectionLine);
      connectionLine = null;
    }
  }

  function initFallbackGlobe() {
    const container = document.getElementById('globe-canvas-container');
    if (!container) return;

    container.innerHTML = `
      <div class="fallback-globe">
        <div class="globe-sphere"></div>
        <div class="globe-grid"></div>
        <div class="provider-dots"></div>
      </div>
      <style>
        .fallback-globe {
          width: 100%;
          height: 100%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          perspective: 1000px;
        }
        .globe-sphere {
          width: 350px;
          height: 350px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #1a2a4a, #0a0a1a);
          box-shadow:
            inset -30px -30px 60px rgba(0,0,0,0.5),
            0 0 80px rgba(59, 130, 246, 0.3),
            0 0 120px rgba(59, 130, 246, 0.1);
          animation: rotate-fallback-globe 40s linear infinite;
          transform-style: preserve-3d;
        }
        .globe-grid {
          position: absolute;
          width: 350px;
          height: 350px;
          border-radius: 50%;
          border: 2px solid rgba(59, 130, 246, 0.15);
          background:
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 25px,
              rgba(59, 130, 246, 0.08) 25px,
              rgba(59, 130, 246, 0.08) 26px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 25px,
              rgba(59, 130, 246, 0.08) 25px,
              rgba(59, 130, 246, 0.08) 26px
            );
          animation: rotate-fallback-globe 40s linear infinite;
        }
        .provider-dots {
          position: absolute;
          width: 350px;
          height: 350px;
        }
        @keyframes rotate-fallback-globe {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(360deg); }
        }
      </style>
    `;

    addFallbackMarkers();
  }

  function addFallbackMarkers() {
    const dotsContainer = document.querySelector('.provider-dots');
    if (!dotsContainer) return;

    LLM_PROVIDERS.forEach(provider => {
      const dot = document.createElement('div');
      dot.className = `provider-marker ${provider.id}`;
      dot.style.cssText = `
        position: absolute;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: ${provider.color};
        box-shadow: 0 0 20px ${provider.color}, 0 0 40px ${provider.color}50;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        animation: pulse-marker 2s ease-in-out infinite;
        animation-delay: ${Math.random() * 2}s;
      `;

      const x = ((provider.location.lon + 180) / 360) * 100;
      const y = ((90 - provider.location.lat) / 180) * 100;
      dot.style.left = `calc(${x}% - 7px)`;
      dot.style.top = `calc(${y}% - 7px)`;
      dot.title = `${provider.name} - Click for details`;

      dot.addEventListener('click', () => selectProvider(provider.id, true));
      dot.addEventListener('mouseenter', () => {
        dot.style.transform = 'scale(1.5)';
        dot.style.boxShadow = `0 0 30px ${provider.color}, 0 0 60px ${provider.color}`;
      });
      dot.addEventListener('mouseleave', () => {
        dot.style.transform = 'scale(1)';
        dot.style.boxShadow = `0 0 20px ${provider.color}, 0 0 40px ${provider.color}50`;
      });

      dotsContainer.appendChild(dot);
    });

    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse-marker {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }
    `;
    document.head.appendChild(style);
  }

  function latLonToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    return new THREE.Vector3(x, y, z);
  }

  function onWindowResize() {
    const container = document.getElementById('globe-canvas-container');
    if (!container || !camera || !renderer) return;

    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }

  // ============================================
  // UI RENDERING
  // ============================================

  function renderProvidersList() {
    const container = document.getElementById('providers-list');
    if (!container) return;

    const filteredProviders = currentFilter === 'all'
      ? LLM_PROVIDERS
      : LLM_PROVIDERS.filter(p => p.category === currentFilter);

    container.innerHTML = filteredProviders.map(provider => {
      const trendIcon = provider.trend === 'up' ? '↑' : provider.trend === 'down' ? '↓' : '→';
      const trendColor = provider.trend === 'up' ? '#22c55e' : provider.trend === 'down' ? '#ef4444' : '#f59e0b';

      return `
      <div class="provider-card ${selectedProvider === provider.id ? 'selected' : ''}"
           data-provider="${provider.id}"
           onclick="window.parallelInternet.selectProvider('${provider.id}', true)"
           onmouseenter="window.parallelInternet.highlightMarker('${provider.id}')"
           onmouseleave="window.parallelInternet.unhighlightMarker('${provider.id}')">
        <div class="provider-header">
          <div class="provider-name">
            <div class="provider-logo" style="background: ${provider.color}20; color: ${provider.color};">
              ${provider.logo}
            </div>
            <span class="provider-title">${provider.name}</span>
          </div>
          <div class="provider-actions">
            <button class="provider-compare-btn ${comparedProviders.includes(provider.id) ? 'active' : ''}"
                    onclick="event.stopPropagation(); window.parallelInternet.addToComparison('${provider.id}')"
                    title="Add to comparison">
              ⚖️
            </button>
            <span class="provider-status ${provider.status}">${provider.status}</span>
          </div>
        </div>
        <div class="provider-stats">
          <div class="stat-box">
            <div class="stat-label">Input</div>
            <div class="stat-value price">$${provider.pricing.input.toFixed(2)}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Output</div>
            <div class="stat-value price">$${provider.pricing.output.toFixed(2)}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Speed</div>
            <div class="stat-value speed">${provider.performance.tokensPerSec}</div>
          </div>
        </div>
        <div class="provider-extra-stats">
          <span class="extra-stat">
            <span class="extra-label">Context:</span>
            <span class="extra-value">${formatNumber(provider.contextWindow.reported)}</span>
          </span>
          <span class="extra-stat">
            <span class="extra-label">Latency:</span>
            <span class="extra-value">${provider.performance.latency}s</span>
          </span>
          <span class="trend-badge ${provider.trend}">${trendIcon}</span>
          ${provider.freeChat ? '<span class="free-badge">Free Chat</span>' : ''}
        </div>
        <div class="context-visual">
          <div class="context-bar reported" style="width: ${Math.min(100, (provider.contextWindow.reported / 200000) * 100)}%;"></div>
        </div>
      </div>
    `;
    }).join('');
  }

  function renderLiveTicker() {
    const ticker = document.getElementById('live-ticker');
    if (!ticker) return;

    const totalTokens = LLM_PROVIDERS.reduce((sum, p) => sum + p.monthlyTokens, 0);
    const totalCost = LLM_PROVIDERS.reduce((sum, p) => {
      return sum + ((p.monthlyTokens / 1000000) * ((p.pricing.input + p.pricing.output) / 2));
    }, 0);
    const avgLatency = LLM_PROVIDERS.reduce((sum, p) => sum + p.performance.latency, 0) / LLM_PROVIDERS.length;
    const activeProviders = LLM_PROVIDERS.filter(p => p.status === 'online').length;

    ticker.innerHTML = `
      <div class="ticker-item">
        <span class="ticker-label">Total Tokens/Month</span>
        <span class="ticker-value">${formatNumber(totalTokens)}</span>
      </div>
      <div class="ticker-item">
        <span class="ticker-label">Est. Monthly Cost</span>
        <span class="ticker-value cost">$${totalCost.toFixed(0)}</span>
      </div>
      <div class="ticker-item">
        <span class="ticker-label">Avg Latency</span>
        <span class="ticker-value requests">${avgLatency.toFixed(1)}s</span>
      </div>
      <div class="ticker-item">
        <span class="ticker-label">Active Providers</span>
        <span class="ticker-value" style="color: #22c55e;">${activeProviders}/${LLM_PROVIDERS.length}</span>
      </div>
    `;
  }

  function renderPerformanceChart() {
    const canvas = document.getElementById('performance-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width - 28;
    canvas.height = 150;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sort by tokens per second and take top 10
    const sorted = [...LLM_PROVIDERS]
      .sort((a, b) => b.performance.tokensPerSec - a.performance.tokensPerSec)
      .slice(0, 10);

    const maxSpeed = Math.max(...sorted.map(p => p.performance.tokensPerSec));
    const barWidth = (canvas.width - 60) / sorted.length - 8;
    const maxBarHeight = canvas.height - 40;

    sorted.forEach((provider, i) => {
      const x = 30 + i * (barWidth + 8);
      const barHeight = (provider.performance.tokensPerSec / maxSpeed) * maxBarHeight;
      const y = canvas.height - 20 - barHeight;

      // Bar with gradient
      const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
      gradient.addColorStop(0, provider.color);
      gradient.addColorStop(1, provider.color + '40');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Highlight selected
      if (selectedProvider === provider.id) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 1, y - 1, barWidth + 2, barHeight + 2);
      }

      // Speed on top of bar
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${provider.performance.tokensPerSec}`, x + barWidth / 2, y - 5);

      // Provider initial
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(provider.logo, x + barWidth / 2, canvas.height - 5);
    });

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('tok/s', 0, 10);
  }

  // ============================================
  // UTILITIES
  // ============================================

  function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toString();
  }

  function selectProvider(providerId, showPanel = false) {
    selectedProvider = providerId;
    renderProvidersList();
    renderPerformanceChart();

    markers.forEach(marker => {
      if (marker.userData.id === providerId) {
        marker.scale.setScalar(2);
      } else {
        marker.scale.setScalar(1);
      }
    });

    // Draw connection lines to related companies
    if (scene) {
      drawConnectionLines(providerId);
    }

    if (showPanel) {
      const provider = LLM_PROVIDERS.find(p => p.id === providerId);
      if (provider) {
        showDetailPanel(provider);

        if (globe) {
          const pos = latLonToVector3(provider.location.lat, provider.location.lon, 1);
          const targetRotationY = Math.atan2(pos.x, pos.z);

          const startRotation = globe.rotation.y;
          const diff = targetRotationY - startRotation;
          const normalizedDiff = ((diff + Math.PI) % (2 * Math.PI)) - Math.PI;

          let progress = 0;
          const animateRotation = () => {
            progress += 0.05;
            if (progress < 1) {
              globe.rotation.y = startRotation + normalizedDiff * easeOutCubic(progress);
              requestAnimationFrame(animateRotation);
            }
          };

          autoRotate = false;
          animateRotation();
        }
      }
    }
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function closeDetail() {
    selectedProvider = null;
    hideDetailPanel();
    renderProvidersList();
    renderPerformanceChart();

    // Clear connection lines
    if (scene) {
      clearConnectionLines();
    }

    markers.forEach(marker => {
      marker.scale.setScalar(1);
    });
  }

  function setFilter(filter) {
    currentFilter = filter;
    renderProvidersList();
    updateFilterCount();

    document.querySelectorAll('.filter-pill').forEach(pill => {
      pill.classList.toggle('active', pill.dataset.filter === filter);
    });
  }

  function updateFilterCount() {
    const countEl = document.getElementById('provider-count');
    if (countEl) {
      const count = currentFilter === 'all'
        ? LLM_PROVIDERS.length
        : LLM_PROVIDERS.filter(p => p.category === currentFilter).length;
      countEl.textContent = `(${count})`;
    }
  }

  function addToComparison(providerId) {
    const index = comparedProviders.indexOf(providerId);
    if (index === -1 && comparedProviders.length < 4) {
      comparedProviders.push(providerId);
    } else if (index !== -1) {
      comparedProviders.splice(index, 1);
    }
    renderProvidersList();
    renderComparison();
  }

  function renderComparison() {
    const container = document.getElementById('comparison-slots');
    if (!container) return;

    if (comparedProviders.length === 0) {
      container.innerHTML = '<div class="comparison-empty">Click ⚖️ on providers to compare</div>';
      return;
    }

    container.innerHTML = comparedProviders.map(id => {
      const provider = LLM_PROVIDERS.find(p => p.id === id);
      if (!provider) return '';
      return `
        <div class="comparison-card">
          <div class="comparison-card-header">
            <div class="comparison-card-logo" style="background: ${provider.color}20; color: ${provider.color};">${provider.logo}</div>
            <span class="comparison-card-name">${provider.name}</span>
            <button class="comparison-card-remove" onclick="window.parallelInternet.addToComparison('${provider.id}')">×</button>
          </div>
          <div class="comparison-card-stats">
            <div class="comparison-stat">
              <div class="comparison-stat-label">Output</div>
              <div class="comparison-stat-value price">$${provider.pricing.output.toFixed(2)}</div>
            </div>
            <div class="comparison-stat">
              <div class="comparison-stat-label">Speed</div>
              <div class="comparison-stat-value speed">${provider.performance.tokensPerSec}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  let isGlobeFullscreen = false;
  let isDataFullscreen = false;

  function toggleFullscreen(section) {
    if (section === 'globe') {
      const globeContainer = document.getElementById('globe-section');
      if (!globeContainer) return;
      isGlobeFullscreen = !isGlobeFullscreen;
      globeContainer.classList.toggle('fullscreen', isGlobeFullscreen);
      setTimeout(() => onWindowResize(), 100);
    } else if (section === 'data') {
      const dataPanel = document.querySelector('.providers-panel');
      if (!dataPanel) return;
      isDataFullscreen = !isDataFullscreen;
      dataPanel.classList.toggle('fullscreen', isDataFullscreen);
    }
  }

  function resetGlobe() {
    if (globe) {
      globe.rotation.x = 0;
      globe.rotation.y = 0;
    }
    autoRotate = true;
  }

  function toggleRotation() {
    autoRotate = !autoRotate;
    const btn = document.getElementById('rotation-btn');
    if (btn) {
      btn.classList.toggle('active', autoRotate);
    }
  }

  function openCustomizeProviders() {
    // Stub - full implementation would show provider selection modal
    console.log('[Parallel Internet] Customize providers not implemented in this version');
  }

  function closeCustomizeProviders() {
    const modal = document.getElementById('customize-providers-modal');
    if (modal) modal.remove();
  }

  // ============================================
  // DATA CONTEXT EXPORT (for chat integration)
  // ============================================

  function getDataContext() {
    const selected = selectedProvider ? LLM_PROVIDERS.find(p => p.id === selectedProvider) : null;
    return {
      templateType: 'tech',
      providers: LLM_PROVIDERS,
      selectedProvider: selected,
      currentFilter: currentFilter,
      comparedProviders: comparedProviders.map(id => LLM_PROVIDERS.find(p => p.id === id)).filter(Boolean),
      stats: {
        totalProviders: LLM_PROVIDERS.length,
        totalTokens: LLM_PROVIDERS.reduce((s, p) => s + p.monthlyTokens, 0),
        avgLatency: (LLM_PROVIDERS.reduce((s, p) => s + p.performance.latency, 0) / LLM_PROVIDERS.length).toFixed(2),
        fastestProvider: [...LLM_PROVIDERS].sort((a, b) => b.performance.tokensPerSec - a.performance.tokensPerSec)[0],
        cheapestProvider: [...LLM_PROVIDERS].sort((a, b) => a.pricing.output - b.pricing.output)[0]
      }
    };
  }

  // ============================================
  // EMBEDDED CHAT WIDGET
  // ============================================

  let chatHistory = [];
  let chatProvider = 'deepseek';

  function initChat() {
    const chatContainer = document.getElementById('pi-data-chat');
    if (!chatContainer) return;

    const input = document.getElementById('pi-chat-input');
    const sendBtn = document.getElementById('pi-chat-send');
    const providerSelect = document.getElementById('pi-chat-provider');

    if (sendBtn) {
      sendBtn.addEventListener('click', sendChatMessage);
    }

    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
      });
    }

    if (providerSelect) {
      providerSelect.addEventListener('change', (e) => {
        chatProvider = e.target.value;
      });
    }
  }

  async function sendChatMessage() {
    const input = document.getElementById('pi-chat-input');
    const messagesContainer = document.getElementById('pi-chat-messages');
    if (!input || !messagesContainer) return;

    const content = input.value.trim();
    if (!content) return;

    // Add user message to UI
    appendChatMessage('user', content);
    input.value = '';

    // Add to history
    chatHistory.push({ role: 'user', content });

    // Get data context for LLM
    const dataContext = getDataContext();

    // Build system prompt with data context
    const systemPrompt = buildDataAwarePrompt(dataContext);

    // Show typing indicator
    const typingId = showTypingIndicator();

    try {
      // Send to LLM via IPC bridge (if available) or fallback
      if (window.electronAPI && window.electronAPI.sendLlmChat) {
        const response = await window.electronAPI.sendLlmChat({
          content,
          provider: chatProvider,
          history: chatHistory.slice(-10), // Last 10 messages for context
          systemPrompt
        });

        removeTypingIndicator(typingId);
        appendChatMessage('assistant', response);
        chatHistory.push({ role: 'assistant', content: response });
      } else {
        // Fallback: Show context-aware mock response
        removeTypingIndicator(typingId);
        const mockResponse = generateMockResponse(content, dataContext);
        appendChatMessage('assistant', mockResponse);
        chatHistory.push({ role: 'assistant', content: mockResponse });
      }
    } catch (error) {
      removeTypingIndicator(typingId);
      appendChatMessage('error', 'Failed to get response. Please try again.');
    }
  }

  function buildDataAwarePrompt(ctx) {
    const providerSummary = ctx.providers.slice(0, 5).map(p =>
      `${p.name}: $${p.pricing.output}/M output, ${p.performance.tokensPerSec} tok/s, ${formatNumber(p.contextWindow.reported)} context`
    ).join('\n');

    return `You are an expert AI assistant for an LLM provider dashboard. You have real-time data on ${ctx.providers.length} AI providers.

KEY DATA:
${providerSummary}
...and ${ctx.providers.length - 5} more providers

FASTEST: ${ctx.stats.fastestProvider.name} (${ctx.stats.fastestProvider.performance.tokensPerSec} tok/s)
CHEAPEST: ${ctx.stats.cheapestProvider.name} ($${ctx.stats.cheapestProvider.pricing.output}/M)

${ctx.selectedProvider ? `USER IS VIEWING: ${ctx.selectedProvider.name} - ${ctx.selectedProvider.models.join(', ')}` : ''}
${ctx.comparedProviders.length > 0 ? `COMPARING: ${ctx.comparedProviders.map(p => p.name).join(' vs ')}` : ''}

Answer questions about LLM providers, pricing, performance, and capabilities. Be specific with numbers from the data. Keep responses concise.`;
  }

  function generateMockResponse(query, ctx) {
    const q = query.toLowerCase();

    if (q.includes('fastest') || q.includes('speed')) {
      const fastest = ctx.stats.fastestProvider;
      return `The fastest provider is **${fastest.name}** with ${fastest.performance.tokensPerSec} tokens/second. For comparison, the average is ${ctx.stats.avgLatency}s latency.`;
    }

    if (q.includes('cheap') || q.includes('price') || q.includes('cost')) {
      const cheapest = ctx.stats.cheapestProvider;
      return `The most affordable provider is **${cheapest.name}** at $${cheapest.pricing.output}/M tokens output. Free options include Meta AI (Llama, self-hosted) and Groq's free tier.`;
    }

    if (q.includes('context') || q.includes('window')) {
      const longest = [...ctx.providers].sort((a, b) => b.contextWindow.reported - a.contextWindow.reported)[0];
      return `**${longest.name}** has the largest context window at ${formatNumber(longest.contextWindow.reported)} tokens. Google Gemini 1.5 Pro claims 2M but ~1M is reliably usable.`;
    }

    if (ctx.selectedProvider) {
      const p = ctx.selectedProvider;
      return `**${p.name}** offers ${p.models.length} models including ${p.models[0]}. Pricing: $${p.pricing.input}/M input, $${p.pricing.output}/M output. Speed: ${p.performance.tokensPerSec} tok/s.`;
    }

    return `I have data on ${ctx.providers.length} AI providers. Ask me about pricing, speed, context windows, or specific providers!`;
  }

  function appendChatMessage(role, content) {
    const messagesContainer = document.getElementById('pi-chat-messages');
    if (!messagesContainer) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `pi-chat-message ${role}`;

    if (role === 'user') {
      msgDiv.innerHTML = `<div class="msg-content user-msg">${escapeHtml(content)}</div>`;
    } else if (role === 'assistant') {
      // Simple markdown-like formatting
      const formatted = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
      msgDiv.innerHTML = `<div class="msg-content assistant-msg">${formatted}</div>`;
    } else {
      msgDiv.innerHTML = `<div class="msg-content error-msg">${escapeHtml(content)}</div>`;
    }

    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function showTypingIndicator() {
    const messagesContainer = document.getElementById('pi-chat-messages');
    if (!messagesContainer) return null;

    const id = 'typing-' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.id = id;
    typingDiv.className = 'pi-chat-message assistant typing';
    typingDiv.innerHTML = `<div class="msg-content assistant-msg"><span class="typing-dots">...</span></div>`;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return id;
  }

  function removeTypingIndicator(id) {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function clearChat() {
    chatHistory = [];
    const messagesContainer = document.getElementById('pi-chat-messages');
    if (messagesContainer) {
      messagesContainer.innerHTML = '';
    }
  }

  // ============================================
  // EXPORTS
  // ============================================

  // ============================================
  // ADD COMPANY FORM
  // ============================================

  function showAddCompanyForm() {
    const modal = document.getElementById('add-company-modal');
    if (modal) {
      modal.classList.add('show');
    }
  }

  function hideAddCompanyForm() {
    const modal = document.getElementById('add-company-modal');
    if (modal) {
      modal.classList.remove('show');
    }
  }

  function submitNewCompany(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    const newCompany = {
      id: formData.get('name').toLowerCase().replace(/\s+/g, '-'),
      name: formData.get('name'),
      logo: formData.get('name').charAt(0).toUpperCase(),
      color: formData.get('color') || '#3b82f6',
      status: 'online',
      location: {
        lat: parseFloat(formData.get('lat')) || 37.7749,
        lon: parseFloat(formData.get('lon')) || -122.4194
      },
      category: formData.get('category') || 'platform',
      subcategory: formData.get('subcategory') || 'other',
      models: formData.get('models') ? formData.get('models').split(',').map(m => m.trim()) : [],
      pricing: {
        input: parseFloat(formData.get('priceInput')) || 0,
        output: parseFloat(formData.get('priceOutput')) || 0,
        cachedInput: 0
      },
      contextWindow: { reported: 128000, actual: 128000 },
      subscription: { name: 'API', price: 0, tokensIncluded: 'Pay-per-use' },
      performance: {
        latency: parseFloat(formData.get('latency')) || 1.0,
        tokensPerSec: parseInt(formData.get('speed')) || 50
      },
      monthlyTokens: 0,
      trend: 'stable',
      founded: formData.get('founded') || new Date().getFullYear().toString(),
      hq: formData.get('hq') || 'Unknown',
      website: formData.get('website') || '',
      docs: formData.get('docs') || '',
      social: {
        x: formData.get('socialX') || '',
        linkedin: formData.get('socialLinkedin') || '',
        github: formData.get('socialGithub') || ''
      },
      relationships: {}
    };

    // Add to providers array
    LLM_PROVIDERS.push(newCompany);

    // Re-render
    renderProvidersList();
    updateFilterCount();

    // Add marker to globe if available
    if (scene && globe) {
      addMarkerToGlobe(newCompany);
    }

    // Close form and show success
    hideAddCompanyForm();
    form.reset();

    // Select the new company
    selectProvider(newCompany.id, true);

    console.log('[Parallel Internet] Added new company:', newCompany.name);
  }

  function addMarkerToGlobe(provider) {
    if (!scene || typeof THREE === 'undefined') return;

    const pos = latLonToVector3(provider.location.lat, provider.location.lon, 1.02);
    const color = new THREE.Color(provider.color);

    const geometry = new THREE.SphereGeometry(0.025, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: color });
    const marker = new THREE.Mesh(geometry, material);

    marker.position.copy(pos);
    marker.userData = provider;

    globe.add(marker);
    markers.push(marker);

    // Add glow
    const glowGeometry = new THREE.SphereGeometry(0.04, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.copy(pos);
    glow.userData.providerId = provider.id;
    globe.add(glow);
    glowMeshes.push(glow);
  }

  window.parallelInternet = {
    init,
    selectProvider,
    closeDetail,
    setFilter,
    addToComparison,
    toggleFullscreen,
    resetGlobe,
    toggleRotation,
    openCustomizeProviders,
    closeCustomizeProviders,
    getProviders: () => LLM_PROVIDERS,
    getSelectedProvider: () => selectedProvider,
    // Phase 4: New exports
    highlightMarker,
    unhighlightMarker,
    getDataContext,
    sendChatMessage,
    clearChat,
    // Phase 5: Panel & Form
    startDragPanel,
    showAddCompanyForm,
    hideAddCompanyForm,
    submitNewCompany
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
