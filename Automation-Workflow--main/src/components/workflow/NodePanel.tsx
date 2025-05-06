import React from 'react';
import { NodeCategory, NodeType } from '../../types/flow';
import { Database, Github, Table2, FileText as NotionIcon, Building2, Mail, MessageSquare, FolderOpen, FileEdit, Webhook, Slack as SlackIcon, MessageSquare as TeamsIcon, FileText, Send, Globe, Youtube, FileSearch, Search, Download, Upload, Save, StickyNote, Tractor, Zap, FileInput, GitBranch, Merge, Brain, BookOpen, Upload as KBLoader, Search as KBSearch, RefreshCw, File, Apple as Api, FileSpreadsheet, Link, BookOpen as Wiki, Newspaper, Music, Camera, MessageCircle, Database as DataCollector, FileText as FileReader, Bell, Users, FileJson, FileCode, Cog, MailCheck, MailWarning, Clock, Share2, Cloud } from 'lucide-react';
import { useTheme } from '../../utils/themeProvider';

// Custom logo components for AI models
const OpenAILogo: React.FC<any> = (props) => (
  <div className="w-5 h-5 relative flex items-center justify-center">
    <img 
      src="/logos/openai.png" 
      alt="OpenAI" 
      className="w-full h-full object-contain"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = "https://openai.com/favicon.ico"; 
        target.onerror = null;
      }}
      {...props}
    />
  </div>
);

const AnthropicLogo: React.FC<any> = (props) => (
  <div className="w-5 h-5 relative flex items-center justify-center">
    <img 
      src="/logos/anthropic.png" 
      alt="Anthropic" 
      className="w-full h-full object-contain"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = "https://www.anthropic.com/images/favicon.svg"; 
        target.onerror = null;
      }}
      {...props}
    />
  </div>
);

const GeminiLogo: React.FC<any> = (props) => (
  <div className="w-5 h-5 relative flex items-center justify-center">
    <img 
      src="/logos/gemini.png" 
      alt="Gemini" 
      className="w-full h-full object-contain"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = "https://www.gstatic.com/lamda/images/favicon_v1_70x70.png"; 
        target.onerror = null;
      }}
      {...props}
    />
  </div>
);

const CohereLogo: React.FC<any> = (props) => (
  <div className="w-5 h-5 relative flex items-center justify-center">
    <img 
      src="/logos/cohere.png" 
      alt="Cohere" 
      className="w-full h-full object-contain"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = "https://cohere.com/favicon.ico"; 
        target.onerror = null;
      }}
      {...props}
    />
  </div>
);

const PerplexityLogo: React.FC<any> = (props) => (
  <div className="w-5 h-5 relative flex items-center justify-center">
    <img 
      src="/logos/perplexity.png" 
      alt="Perplexity" 
      className="w-full h-full object-contain"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = "https://www.perplexity.ai/favicon.ico"; 
        target.onerror = null;
      }}
      {...props}
    />
  </div>
);

const XAILogo: React.FC<any> = (props) => (
  <div className="w-5 h-5 relative flex items-center justify-center">
    <img 
      src="/logos/xai.png" 
      alt="X.AI" 
      className="w-full h-full object-contain"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = "https://x.ai/favicon.ico"; 
        target.onerror = null;
      }}
      {...props}
    />
  </div>
);

const AWSLogo: React.FC<any> = (props) => (
  <div className="w-5 h-5 relative flex items-center justify-center">
    <img 
      src="/logos/aws-bedrock.png" 
      alt="AWS Bedrock" 
      className="w-full h-full object-contain"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = "https://a0.awsstatic.com/libra-css/images/site/fav/favicon.ico"; 
        target.onerror = null;
      }}
      {...props}
    />
  </div>
);

const AzureLogo: React.FC<any> = (props) => (
  <div className="w-5 h-5 relative flex items-center justify-center">
    <img 
      src="/logos/azure-openai.png" 
      alt="Azure OpenAI" 
      className="w-full h-full object-contain"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = "https://learn.microsoft.com/en-us/azure/ai-services/openai/media/azure-openai-icon.png"; 
        target.onerror = null;
      }}
      {...props}
    />
  </div>
);

const Claude35Logo: React.FC<any> = (props) => (
  <div className="w-5 h-5 relative flex items-center justify-center">
    <img 
      src="/logos/claude35.png" 
      alt="Claude 3.5" 
      className="w-full h-full object-contain"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = "https://www.anthropic.com/images/favicon.svg"; 
        target.onerror = null;
      }}
      {...props}
    />
  </div>
);

interface NodeInfo {
  type: NodeType;
  label: string;
  icon: React.FC<any>;
  description: string;
}

const nodeCategories: Record<NodeCategory, NodeInfo[]> = {
  general: [
    { type: 'input', label: 'Input', icon: FileInput, description: 'User-provided text input (exposes data via .output property)' },
  //  { type: 'web-extractor', label: 'Web Extractor', icon: Globe, description: 'Extracts structured/unstructured text from web pages' },

    { type: 'document-to-text', label: 'Document to Text', icon: FileSearch, description: 'Converts PDFs, Word files, and scanned images into text' },
   // { type: 'google-search', label: 'Google Search', icon: Search, description: 'Retrieves search results dynamically' },
    //{ type: 'http-get', label: 'HTTP GET', icon: Download, description: 'Fetches data from APIs and URLs' },
    //{ type: 'file-upload', label: 'File ', icon: Upload, description: 'Uploads files for processing' },
    { type: 'output', label: ' Output', icon: Send, description: 'Displays processed text' },
    { type: 'file-save', label: 'File Save', icon: Save, description: 'Stores output in specified formats (PDF, CSV, JSON, DOCX, TXT)' },
    { type: 'note', label: 'Notes', icon: StickyNote, description: 'Saves output as a note for reference' },
    { type: 'scripts', label: 'Scripts', icon: FileCode, description: 'Write and execute custom scripts' },
   // { type: 'api', label: 'API', icon: Api, description: 'Make an API request to a given URL' },
   { type: 'pipeline', label: 'Workflow', icon: Zap, description: 'Create and manage workflows' }, // Add Pipeline node
    { type: 'share', label: 'Share', icon: Share2, description: 'Share workflows with others' }, // Add Share node
  ],
  llms: [
    { type: 'openai', label: 'OpenAI', icon: OpenAILogo, description: 'OpenAI GPT models' },
    { type: 'anthropic', label: 'Anthropic', icon: AnthropicLogo, description: 'Claude models' },
    { type: 'claude35', label: 'Claude 3.5', icon: Claude35Logo, description: 'Claude 3.5 Sonnet model' },
    { type: 'gemini', label: 'Gemini', icon: GeminiLogo, description: 'Google Gemini models' },
    { type: 'cohere', label: 'Cohere', icon: CohereLogo, description: 'Cohere Command models' },
    { type: 'perplexity', label: 'Perplexity', icon: PerplexityLogo, description: 'Perplexity AI models with online search' },
    { type: 'xai', label: 'X.AI', icon: XAILogo, description: 'X.AI Grok models' },
    { type: 'aws', label: 'AWS Bedrock', icon: AWSLogo, description: 'AWS Bedrock AI services' },
    { type: 'azure', label: 'Azure OpenAI', icon: AzureLogo, description: 'Azure OpenAI services' },
  ],
  'knowledge-base': [
    { type: 'kb-reader', label: 'Query Knowledge', icon: BookOpen, description: 'Query and retrieve information from knowledge base' },
    { type: 'kb-loader', label: 'Upload Knowledge', icon: Upload, description: 'Load data into an existing knowledge base' },
    { type: 'kb-search', label: 'Smart Search', icon: Search, description: 'Semantic search across knowledge base' },
    { type: 'kb-sync', label: 'Sync Knowledge', icon: RefreshCw, description: 'Synchronize knowledge base data' },
  ],
  integrations: [
    { type: 'mysql', label: 'MySQL', icon: Database, description: 'Execute SQL queries and interact with MySQL databases' },
    { type: 'mongodb', label: 'MongoDB', icon: Database, description: 'Query and manage MongoDB databases' },
    { type: 'github', label: 'GitHub', icon: Github, description: 'Manage GitHub repositories and pull requests' },
    { type: 'airtable', label: 'Airtable', icon: Table2, description: 'Interact with Airtable databases' },
    { type: 'notion', label: 'Notion', icon: NotionIcon, description: 'Manage Notion pages and databases' },
    { type: 'hubspot', label: 'HubSpot', icon: Building2, description: 'Access HubSpot CRM data' },
    { type: 'gmail', label: 'Gmail', icon: Mail, description: 'Send and manage Gmail emails' },
    { type: 'outlook', label: 'Outlook', icon: Mail, description: 'Send and manage Outlook emails' },
    { type: 'discord', label: 'Discord', icon: MessageSquare, description: 'Send messages to Discord channels' },
    { type: 'google-drive', label: 'Google Drive', icon: FolderOpen, description: 'Manage files on Google Drive' },
    { type: 'onedrive', label: 'OneDrive', icon: FolderOpen, description: 'Manage files on OneDrive' },
    { type: 'google-docs', label: 'Google Docs', icon: FileEdit, description: 'Read and write Google Docs' },
    { type: 'slack', label: 'Slack', icon: SlackIcon, description: 'Send and read Slack messages' },
    { type: 'teams', label: 'Microsoft Teams', icon: TeamsIcon, description: 'Send messages to Teams channels' },
    { type: 'make-webhook', label: 'Make Webhook', icon: Webhook, description: 'Send data to Make.com webhooks' },
    { type: 'zapier-webhook', label: 'Zapier Webhook', icon: Webhook, description: 'Send data to Zapier webhooks' },
  ],
  'data-loaders': [
    { type: 'file-loader', label: 'File Loader', icon: File, description: 'Load data from local files' },
    { type: 'api-loader', label: 'API', icon: Api, description: 'Load data from REST APIs' },
    { type: 'csv-loader', label: 'CSV', icon: FileSpreadsheet, description: 'Load and parse CSV files' },
    { type: 'url-loader', label: 'URL', icon: Link, description: 'Load data from URLs' },
    { type: 'wiki-loader', label: 'Wiki', icon: Wiki, description: 'Load data from Wikipedia' },
    { type: 'youtube-loader', label: 'YouTube', icon: Youtube, description: 'Load data from YouTube' },
    { type: 'arxiv-loader', label: 'Arxiv', icon: FileText, description: 'Load papers from Arxiv' },
    { type: 'rss-loader', label: 'RSS', icon: Newspaper, description: 'Load data from RSS feeds' },
  ],
  'multi-modal': [
    { type: 'audio-processor', label: 'Audio', icon: Music, description: 'Process and analyze audio files' },
    { type: 'image-processor', label: 'Image', icon: Camera, description: 'Process and analyze images' },
  ],
  logic: [
    { type: 'condition', label: 'Condition', icon: GitBranch, description: 'Branch workflow based on conditions' },
    { type: 'merge', label: 'Merge', icon: Merge, description: 'Combine multiple paths into one' },
    { type: 'time', label: 'Time', icon: Clock, description: 'Time-based operations and triggers' },
    { 
      type: 'ttsql', 
      label: 'Text to SQL', 
      icon: Database, 
      description: 'Convert natural language to SQL queries' 
    },
  ],
  'ai-tools': [
    { type: 'chat-memory', label: 'Chat Memory', icon: MessageCircle, description: 'Store chat history and context' },
    { type: 'data-collector', label: 'Data Collector', icon: DataCollector, description: 'Collect and store chat data' },
    { type: 'chat-file-reader', label: 'Chat File Reader', icon: FileReader, description: 'Read and process chat files' },
    { type: 'outlook-trigger', label: 'Outlook Trigger', icon: MailCheck, description: 'Trigger workflows from Outlook events' },
    { type: 'gmail-trigger', label: 'Gmail Trigger', icon: MailWarning, description: 'Trigger workflows from Gmail events' },
    { type: 'text-processor', label: 'Text Processor', icon: FileText, description: 'Process and analyze text' },
    { type: 'json-handler', label: 'JSON Handler', icon: FileJson, description: 'Handle JSON data operations' },
    { type: 'file-transformer', label: 'File Transformer', icon: FileCode, description: 'Transform file formats' },
    { type: 'ai-task-executor', label: 'AI Task Executor', icon: Cog, description: 'Execute AI-powered tasks' },
    { type: 'notification-node', label: 'Notification Node', icon: Bell, description: 'Send notifications' },
    { type: 'crm-enricher', label: 'CRM Enricher', icon: Users, description: 'Enrich CRM data' },
  ],
};

interface NodePanelProps {
  category: NodeCategory;
  searchQuery: string;
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
}

const onDragStart = (event: React.DragEvent, nodeType: string) => {
  event.dataTransfer.setData('application/reactflow', nodeType);
  event.dataTransfer.effectAllowed = 'move';
};

export const NodePanel: React.FC<NodePanelProps> = ({
  category = 'general',
  searchQuery = '',
  onDragStart,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  
  // Add safety check for category
  const validCategory = (category in nodeCategories) ? category : 'general';
  const nodes = nodeCategories[validCategory] || [];
  
  const filteredNodes = nodes.filter(
    (node) =>
      node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filteredNodes.length === 0) {
    return (
      <div className="p-5">
        <h2 className={`text-lg font-semibold ${isLight ? 'text-theme-dark' : 'text-theme-white'} mb-4`}>
          {validCategory === 'ai-tools' 
            ? 'AI Tools & SparkLayer' 
            : validCategory.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </h2>
        <div className={`${isLight 
            ? 'bg-theme-light/70 backdrop-blur-sm border border-theme-light' 
            : 'bg-theme-medium-dark/20 backdrop-blur-sm border border-theme-medium-dark/50'
          } rounded-lg p-5 text-center`}>
          <Search className={`w-8 h-8 ${isLight ? 'text-theme-medium-dark/70' : 'text-theme-light/70'} mx-auto mb-3`} />
          <p className={`${isLight ? 'text-theme-medium-dark' : 'text-theme-light'}`}>No components found matching "{searchQuery}"</p>
          <p className={`text-xs ${isLight ? 'text-theme-medium-dark/70' : 'text-theme-light/70'} mt-2`}>Try a different search term or category</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5">
      <h2 className={`text-lg font-semibold ${isLight ? 'text-theme-dark' : 'text-theme-white'} mb-4 flex items-center`}>
        <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-theme-medium' : 'bg-theme-medium'} mr-2`}></span>
        {validCategory === 'ai-tools' 
          ? 'AI Tools & SparkLayer' 
          : validCategory.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </h2>
      <div className="grid grid-cols-1 gap-3">
        {filteredNodes.map(({ type, label, icon: Icon, description }) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => onDragStart(e, type)}
            className={`flex items-start p-3 ${
              isLight 
                ? 'bg-theme-light/70 backdrop-blur-sm border border-theme-light hover:border-theme-medium/60 hover:shadow-lg' 
                : 'bg-theme-medium-dark/20 backdrop-blur-sm border border-theme-medium-dark/50 hover:border-theme-medium/60 hover:shadow-lg'
            } rounded-lg cursor-move transition-all group hover:translate-y-[-1px] ${
              isLight 
                ? 'active:bg-theme-medium/20' 
                : 'active:bg-theme-medium/20'
            }`}
          >
            <div className={`flex-shrink-0 p-2 ${
              isLight 
                ? 'bg-theme-medium/20 rounded-md group-hover:bg-theme-medium/30' 
                : 'bg-theme-medium/20 rounded-md group-hover:bg-theme-medium/30'
            } transition-colors`}>
              <Icon className={`w-5 h-5 ${
                isLight 
                  ? 'text-theme-medium-dark group-hover:text-theme-medium' 
                  : 'text-theme-medium group-hover:text-theme-medium'
              }`} />
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${
                isLight 
                  ? 'text-theme-dark group-hover:text-theme-medium' 
                  : 'text-theme-white group-hover:text-theme-medium'
              } transition-colors`}>{label}</h3>
              <p className={`text-xs ${
                isLight 
                  ? 'text-theme-medium-dark/70 group-hover:text-theme-medium-dark' 
                  : 'text-theme-light/70 group-hover:text-theme-light'
              } mt-1 transition-colors`}>{description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};