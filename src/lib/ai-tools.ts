// Directory of popular AI tools shown on /ai-tools.
// Each entry links to the tool's own official website.

export const AI_TOOL_CATEGORIES = [
  "Video",
  "Image",
  "Voice & Avatars",
  "Chat Assistants",
  "Writing",
  "Coding",
  "SEO & Marketing",
  "Productivity",
  "Design & UI",
  "Data & Analytics",
  "Automation & Agents",
  "Education & Research",
  "Music & Audio",
  "Business & Sales",
  "Security",
  "Utilities",
] as const;

export type AiToolCategory = (typeof AI_TOOL_CATEGORIES)[number];

export type AiTool = {
  name: string;
  url: string;
  category: AiToolCategory;
  text: string;
  tags: string[];
  badge?: "Trending" | "Popular" | "Free plan" | "New" | "Taught at SkillTek";
};

export const AI_TOOLS: AiTool[] = [
  // Chat assistants
  { name: "ChatGPT", url: "https://chatgpt.com", category: "Chat Assistants", text: "OpenAI's assistant for writing, ideas, study help and coding.", tags: ["Chat", "Images", "Voice"], badge: "Popular" },
  { name: "Claude", url: "https://claude.ai", category: "Chat Assistants", text: "Anthropic's assistant for long documents, writing and code.", tags: ["Long context", "Docs", "Paid plans"] },
  { name: "Gemini", url: "https://gemini.google.com", category: "Chat Assistants", text: "Google's assistant, connected to Gmail, Docs and Search.", tags: ["Google apps", "Images", "Free"], badge: "Free plan" },
  { name: "Microsoft Copilot", url: "https://copilot.microsoft.com", category: "Chat Assistants", text: "Microsoft's free assistant, also built into Windows and Office.", tags: ["Office", "Web search", "Free"] },
  { name: "Grok", url: "https://grok.com", category: "Chat Assistants", text: "xAI's assistant with real-time access to posts on X.", tags: ["Real-time", "Images", "Chat"] },
  { name: "DeepSeek", url: "https://chat.deepseek.com", category: "Chat Assistants", text: "Free assistant with strong reasoning and maths.", tags: ["Reasoning", "Free", "Open model"], badge: "Free plan" },
  { name: "Meta AI", url: "https://www.meta.ai", category: "Chat Assistants", text: "Meta's assistant, also inside WhatsApp, Instagram and Facebook.", tags: ["WhatsApp", "Images", "Free"] },
  { name: "Poe", url: "https://poe.com", category: "Chat Assistants", text: "Use many AI models from one app and build your own bots.", tags: ["Multi-model", "Bots", "Chat"] },
  { name: "Perplexity", url: "https://www.perplexity.ai", category: "Education & Research", text: "Answer engine that searches the web and cites sources.", tags: ["Search", "Citations", "Research"], badge: "Popular" },

  // Video
  { name: "Sora", url: "https://sora.com", category: "Video", text: "OpenAI's text-to-video generator for realistic clips.", tags: ["Text-to-video", "Realistic", "Remix"], badge: "Trending" },
  { name: "Google Veo", url: "https://deepmind.google/models/veo/", category: "Video", text: "Google's video model with native sound and dialogue.", tags: ["Text-to-video", "Audio", "Cinematic"], badge: "Trending" },
  { name: "Runway", url: "https://runwayml.com", category: "Video", text: "AI video generation and editing tools for creators.", tags: ["Gen video", "VFX", "Editing"], badge: "Popular" },
  { name: "Kling AI", url: "https://klingai.com", category: "Video", text: "Realistic video generation with smooth motion.", tags: ["Text-to-video", "Image-to-video", "1080p"] },
  { name: "Luma Dream Machine", url: "https://lumalabs.ai/dream-machine", category: "Video", text: "Turn text or images into high-quality video.", tags: ["Image-to-video", "Extend", "Characters"] },
  { name: "Pika", url: "https://pika.art", category: "Video", text: "Quick, fun AI video effects and short clips.", tags: ["Effects", "Text-to-video", "Lip sync"] },
  { name: "Hailuo AI", url: "https://hailuoai.video", category: "Video", text: "MiniMax's video generator with strong motion.", tags: ["Text-to-video", "Image-to-video", "Free tries"] },
  { name: "InVideo AI", url: "https://invideo.io", category: "Video", text: "Turn a prompt into a full social or YouTube video.", tags: ["Templates", "Voiceover", "Stock media"] },
  { name: "CapCut", url: "https://www.capcut.com", category: "Video", text: "Free video editor with auto captions and AI effects.", tags: ["Editing", "Captions", "Templates"], badge: "Free plan" },
  { name: "Opus Clip", url: "https://www.opus.pro", category: "Video", text: "Cut long videos into short viral clips automatically.", tags: ["Shorts", "Captions", "Virality score"], badge: "Popular" },
  { name: "Klap", url: "https://klap.app", category: "Video", text: "Turn YouTube videos into TikToks and Reels.", tags: ["Shorts", "Subtitles", "Auto cut"] },
  { name: "Descript", url: "https://www.descript.com", category: "Video", text: "Edit video and podcasts by editing the transcript.", tags: ["Transcript edit", "Overdub", "Podcast"] },
  { name: "VEED", url: "https://www.veed.io", category: "Video", text: "Online video editor with subtitles and AI avatars.", tags: ["Subtitles", "Editor", "Avatars"] },

  // Image
  { name: "Midjourney", url: "https://www.midjourney.com", category: "Image", text: "Artistic, high-quality image generation.", tags: ["Art", "Styles", "Upscale"], badge: "Popular" },
  { name: "Google Nano Banana", url: "https://gemini.google.com", category: "Image", text: "Gemini's image model for edits and consistent characters.", tags: ["Image edit", "Characters", "Free"], badge: "Trending" },
  { name: "Ideogram", url: "https://ideogram.ai", category: "Image", text: "Image generator that writes clean text in pictures.", tags: ["Typography", "Posters", "Logos"] },
  { name: "Leonardo AI", url: "https://leonardo.ai", category: "Image", text: "Images, game assets and design with many styles.", tags: ["Assets", "Styles", "Canvas"] },
  { name: "Adobe Firefly", url: "https://firefly.adobe.com", category: "Image", text: "Adobe's safe-for-commercial-use image and video AI.", tags: ["Generative fill", "Commercial", "Video"] },
  { name: "Flux", url: "https://bfl.ai", category: "Image", text: "Black Forest Labs' state-of-the-art image models.", tags: ["Photoreal", "Open weights", "Pro"] },
  { name: "Stable Diffusion", url: "https://stability.ai", category: "Image", text: "Open-source image model you can run yourself.", tags: ["Open source", "Fine-tune", "Local"] },
  { name: "Krea", url: "https://www.krea.ai", category: "Image", text: "Real-time image generation, upscaling and video.", tags: ["Real-time", "Upscale", "Enhance"] },
  { name: "Remove.bg", url: "https://www.remove.bg", category: "Image", text: "Remove image backgrounds in one click.", tags: ["Background", "Free", "Batch"], badge: "Free plan" },
  { name: "Lexica", url: "https://lexica.art", category: "Image", text: "Search AI images and the prompts behind them.", tags: ["Prompts", "Search", "Gallery"] },

  // Voice & avatars
  { name: "ElevenLabs", url: "https://elevenlabs.io", category: "Voice & Avatars", text: "Natural AI voices, voice cloning and dubbing, including Urdu.", tags: ["Text-to-speech", "Cloning", "Dubbing"], badge: "Popular" },
  { name: "HeyGen", url: "https://www.heygen.com", category: "Voice & Avatars", text: "Talking AI avatars and video translation.", tags: ["Avatars", "Translate", "Lip sync"], badge: "Trending" },
  { name: "Synthesia", url: "https://www.synthesia.io", category: "Voice & Avatars", text: "Training and business videos with AI presenters.", tags: ["Presenters", "120+ languages", "Business"] },
  { name: "D-ID", url: "https://www.d-id.com", category: "Voice & Avatars", text: "Make a photo talk with a realistic AI face.", tags: ["Talking photo", "Agents", "API"] },
  { name: "Murf AI", url: "https://murf.ai", category: "Voice & Avatars", text: "Studio-quality voiceovers for videos and ads.", tags: ["Voiceover", "Studio", "Styles"] },
  { name: "PlayHT", url: "https://play.ht", category: "Voice & Avatars", text: "Realistic text-to-speech for content and apps.", tags: ["TTS", "API", "Cloning"] },
  { name: "Hedra", url: "https://www.hedra.com", category: "Voice & Avatars", text: "Expressive talking characters from an image and audio.", tags: ["Characters", "Lip sync", "Video"] },
  { name: "Tavus", url: "https://www.tavus.io", category: "Voice & Avatars", text: "Personalised AI video and real-time video agents.", tags: ["Personalised", "Agents", "API"] },

  // Writing
  { name: "Grammarly", url: "https://www.grammarly.com", category: "Writing", text: "Fix grammar and improve tone everywhere you type.", tags: ["Grammar", "Tone", "Free"], badge: "Free plan" },
  { name: "QuillBot", url: "https://quillbot.com", category: "Writing", text: "Paraphrase, summarise and check grammar.", tags: ["Paraphrase", "Summarise", "Citations"] },
  { name: "Jasper", url: "https://www.jasper.ai", category: "Writing", text: "On-brand marketing copy for teams.", tags: ["Brand voice", "Campaigns", "Teams"] },
  { name: "Copy.ai", url: "https://www.copy.ai", category: "Writing", text: "Sales and marketing copy plus workflows.", tags: ["Copy", "Workflows", "Sales"] },
  { name: "Writesonic", url: "https://writesonic.com", category: "Writing", text: "SEO articles and blog posts with AI.", tags: ["Blogs", "SEO", "Chat"] },
  { name: "Rytr", url: "https://rytr.me", category: "Writing", text: "Low-cost writer for short content and emails.", tags: ["Emails", "Ads", "Budget"] },
  { name: "Sudowrite", url: "https://www.sudowrite.com", category: "Writing", text: "AI writing partner for fiction and stories.", tags: ["Fiction", "Brainstorm", "Rewrite"] },

  // Coding
  { name: "Claude Code", url: "https://www.anthropic.com/claude-code", category: "Coding", text: "Agentic coding that builds and edits whole projects (paid plan).", tags: ["Agent", "Terminal", "Paid"] },
  { name: "Cursor", url: "https://cursor.com", category: "Coding", text: "AI code editor that understands your whole project.", tags: ["Editor", "Agent", "Autocomplete"], badge: "Popular" },
  { name: "GitHub Copilot", url: "https://github.com/features/copilot", category: "Coding", text: "AI pair programmer inside VS Code and GitHub.", tags: ["Autocomplete", "Chat", "Free tier"] },
  { name: "Windsurf", url: "https://windsurf.com", category: "Coding", text: "Agentic IDE that writes and runs code with you.", tags: ["IDE", "Agent", "Flows"] },
  { name: "Replit", url: "https://replit.com", category: "Coding", text: "Describe an app and the Replit Agent builds and hosts it.", tags: ["Agent", "Hosting", "Browser IDE"] },
  { name: "Lovable", url: "https://lovable.dev", category: "Coding", text: "Build full web apps by chatting, no setup needed.", tags: ["No-code", "Web apps", "Deploy"], badge: "Trending" },
  { name: "Bolt", url: "https://bolt.new", category: "Coding", text: "Prompt, run and deploy full-stack apps in the browser.", tags: ["Full-stack", "Browser", "Deploy"] },
  { name: "v0", url: "https://v0.app", category: "Coding", text: "Vercel's AI for React interfaces and web apps.", tags: ["React", "UI", "Deploy"] },
  { name: "Tabnine", url: "https://www.tabnine.com", category: "Coding", text: "Private AI code completion for teams.", tags: ["Private", "Autocomplete", "Teams"] },

  // SEO & marketing
  { name: "Semrush", url: "https://www.semrush.com", category: "SEO & Marketing", text: "Keyword research, site audits and competitor analysis.", tags: ["Keywords", "Audit", "Competitors"] },
  { name: "Surfer SEO", url: "https://surferseo.com", category: "SEO & Marketing", text: "Write and optimise content that ranks on Google.", tags: ["Content score", "SERP", "Briefs"] },
  { name: "AdCreative.ai", url: "https://www.adcreative.ai", category: "SEO & Marketing", text: "Generate ad creatives built for conversions.", tags: ["Ads", "Creatives", "Scoring"] },
  { name: "Predis.ai", url: "https://predis.ai", category: "SEO & Marketing", text: "Create and schedule social media posts with AI.", tags: ["Social posts", "Carousels", "Schedule"] },
  { name: "Ocoya", url: "https://www.ocoya.com", category: "SEO & Marketing", text: "Social content creation, scheduling and analytics.", tags: ["Scheduling", "Copy", "Analytics"] },
  { name: "Frase", url: "https://www.frase.io", category: "SEO & Marketing", text: "SEO research and content briefs in minutes.", tags: ["Briefs", "Research", "Optimise"] },
  { name: "NeuronWriter", url: "https://neuronwriter.com", category: "SEO & Marketing", text: "Content optimisation with semantic SEO.", tags: ["NLP", "SEO", "Planner"] },

  // Productivity
  { name: "Notion AI", url: "https://www.notion.com/product/ai", category: "Productivity", text: "Write, summarise and search inside your Notion notes.", tags: ["Notes", "Summaries", "Q&A"] },
  { name: "Gamma", url: "https://gamma.app", category: "Productivity", text: "Create presentations, documents and web pages from a prompt.", tags: ["Slides", "Docs", "Websites"], badge: "Popular" },
  { name: "NotebookLM", url: "https://notebooklm.google.com", category: "Productivity", text: "Upload notes and PDFs, then chat or get an audio overview.", tags: ["Study", "Podcast", "Free"], badge: "Free plan" },
  { name: "Otter.ai", url: "https://otter.ai", category: "Productivity", text: "Live meeting notes, transcripts and summaries.", tags: ["Meetings", "Transcripts", "Summaries"] },
  { name: "tl;dv", url: "https://tldv.io", category: "Productivity", text: "Record Zoom, Meet and Teams calls with AI notes.", tags: ["Recording", "Notes", "CRM"] },
  { name: "Fireflies.ai", url: "https://fireflies.ai", category: "Productivity", text: "AI notetaker that joins and summarises your meetings.", tags: ["Notetaker", "Search", "Integrations"] },
  { name: "Motion", url: "https://www.usemotion.com", category: "Productivity", text: "AI calendar that plans your day automatically.", tags: ["Calendar", "Tasks", "Planning"] },
  { name: "ClickUp Brain", url: "https://clickup.com/ai", category: "Productivity", text: "AI for tasks, docs and project management.", tags: ["Projects", "Docs", "Tasks"] },
  { name: "Beautiful.ai", url: "https://www.beautiful.ai", category: "Productivity", text: "Smart slide templates that design themselves.", tags: ["Slides", "Templates", "Teams"] },

  // Design & UI
  { name: "Canva AI", url: "https://www.canva.com", category: "Design & UI", text: "Design posts, posters and slides with Magic Studio.", tags: ["Magic design", "Background", "Templates"], badge: "Free plan" },
  { name: "Figma AI", url: "https://www.figma.com/ai/", category: "Design & UI", text: "Generate and edit UI designs inside Figma.", tags: ["UI", "Prototypes", "Make"] },
  { name: "Uizard", url: "https://uizard.io", category: "Design & UI", text: "Turn sketches or text into app mockups.", tags: ["Mockups", "Wireframes", "Screens"] },
  { name: "Visily", url: "https://www.visily.ai", category: "Design & UI", text: "Easy wireframes and UI for non-designers.", tags: ["Wireframes", "Screenshots", "Teams"] },
  { name: "Relume", url: "https://www.relume.io", category: "Design & UI", text: "Sitemaps and wireframes for websites with AI.", tags: ["Sitemaps", "Wireframes", "Webflow"] },
  { name: "Framer", url: "https://www.framer.com", category: "Design & UI", text: "Design and publish websites with AI help.", tags: ["Websites", "No-code", "Hosting"] },
  { name: "Looka", url: "https://looka.com", category: "Design & UI", text: "AI logo maker and brand kit.", tags: ["Logos", "Brand kit", "Business"] },

  // Data & analytics
  { name: "Julius AI", url: "https://julius.ai", category: "Data & Analytics", text: "Chat with your spreadsheets and get charts.", tags: ["Excel", "Charts", "Analysis"] },
  { name: "Microsoft Power BI Copilot", url: "https://www.microsoft.com/power-platform/products/power-bi", category: "Data & Analytics", text: "Dashboards and reports with AI help.", tags: ["Dashboards", "Reports", "Business"] },
  { name: "Polymer", url: "https://www.polymersearch.com", category: "Data & Analytics", text: "Turn spreadsheets into interactive dashboards.", tags: ["Dashboards", "No-code", "Insights"] },
  { name: "Akkio", url: "https://www.akkio.com", category: "Data & Analytics", text: "No-code predictive analytics for agencies.", tags: ["Forecasts", "No-code", "Reports"] },
  { name: "Hex", url: "https://hex.tech", category: "Data & Analytics", text: "Data notebooks with SQL, Python and AI.", tags: ["SQL", "Python", "Notebooks"] },
  { name: "Rows", url: "https://rows.com", category: "Data & Analytics", text: "Spreadsheet with a built-in AI analyst.", tags: ["Spreadsheet", "AI analyst", "Integrations"] },

  // Automation & agents
  { name: "n8n", url: "https://n8n.io", category: "Automation & Agents", text: "Build AI agents and automations with visual workflows.", tags: ["Workflows", "AI agents", "Self-host"], badge: "Taught at SkillTek" },
  { name: "Make", url: "https://www.make.com", category: "Automation & Agents", text: "Visual automation that connects thousands of apps.", tags: ["Scenarios", "Integrations", "No-code"] },
  { name: "Zapier", url: "https://zapier.com", category: "Automation & Agents", text: "Automate tasks between apps, with AI steps.", tags: ["Zaps", "AI steps", "7,000+ apps"], badge: "Popular" },
  { name: "Manus", url: "https://manus.im", category: "Automation & Agents", text: "General AI agent that completes multi-step tasks.", tags: ["Agent", "Research", "Tasks"], badge: "Trending" },
  { name: "CrewAI", url: "https://www.crewai.com", category: "Automation & Agents", text: "Framework for teams of AI agents working together.", tags: ["Multi-agent", "Python", "Open source"] },
  { name: "Relevance AI", url: "https://relevanceai.com", category: "Automation & Agents", text: "Build an AI workforce without code.", tags: ["Agents", "No-code", "Sales"] },
  { name: "Voiceflow", url: "https://www.voiceflow.com", category: "Automation & Agents", text: "Design chat and voice agents for customer support.", tags: ["Chatbots", "Voice", "Support"] },
  { name: "Botpress", url: "https://botpress.com", category: "Automation & Agents", text: "Build AI chatbots for websites and WhatsApp.", tags: ["Chatbots", "WhatsApp", "Knowledge base"] },
  { name: "Nanonets", url: "https://nanonets.com", category: "Automation & Agents", text: "Extract data from invoices and documents automatically.", tags: ["OCR", "Documents", "Workflows"] },

  // Education & research
  { name: "Khanmigo", url: "https://www.khanmigo.ai", category: "Education & Research", text: "Khan Academy's AI tutor and teaching assistant.", tags: ["Tutor", "Teachers", "Maths"] },
  { name: "Elicit", url: "https://elicit.com", category: "Education & Research", text: "Find and summarise research papers.", tags: ["Papers", "Summaries", "Reviews"] },
  { name: "Consensus", url: "https://consensus.app", category: "Education & Research", text: "Search engine that answers from scientific studies.", tags: ["Science", "Evidence", "Citations"] },
  { name: "Scite", url: "https://scite.ai", category: "Education & Research", text: "See how research papers have been cited.", tags: ["Citations", "Research", "Assistant"] },
  { name: "Quizlet", url: "https://quizlet.com", category: "Education & Research", text: "AI flashcards and practice tests from your notes.", tags: ["Flashcards", "Tests", "Study"] },
  { name: "Duolingo", url: "https://www.duolingo.com", category: "Education & Research", text: "Learn English and other languages with AI practice.", tags: ["Languages", "English", "Free"], badge: "Free plan" },

  // Music & audio
  { name: "Suno", url: "https://suno.com", category: "Music & Audio", text: "Create full songs with vocals from a text prompt.", tags: ["Songs", "Vocals", "Lyrics"], badge: "Trending" },
  { name: "Udio", url: "https://www.udio.com", category: "Music & Audio", text: "Generate high-quality music in any style.", tags: ["Music", "Styles", "Remix"] },
  { name: "Adobe Podcast", url: "https://podcast.adobe.com", category: "Music & Audio", text: "Make voice recordings sound studio-clean.", tags: ["Enhance speech", "Free", "Mic check"], badge: "Free plan" },
  { name: "LALAL.AI", url: "https://www.lalal.ai", category: "Music & Audio", text: "Split vocals and instruments from any song.", tags: ["Stems", "Vocal remover", "Noise"] },
  { name: "Soundraw", url: "https://soundraw.io", category: "Music & Audio", text: "Royalty-free background music for videos.", tags: ["Royalty-free", "Custom length", "Video"] },

  // Business & sales
  { name: "HubSpot AI", url: "https://www.hubspot.com/artificial-intelligence", category: "Business & Sales", text: "CRM with AI for emails, content and customer service.", tags: ["CRM", "Email", "Support"] },
  { name: "Apollo.io", url: "https://www.apollo.io", category: "Business & Sales", text: "Find leads and send AI-written outreach.", tags: ["Leads", "Outreach", "Data"] },
  { name: "Lavender", url: "https://www.lavender.ai", category: "Business & Sales", text: "AI coach for writing better sales emails.", tags: ["Email", "Coaching", "Sales"] },
  { name: "Tidio", url: "https://www.tidio.com", category: "Business & Sales", text: "Website live chat with an AI support agent.", tags: ["Live chat", "Support", "E-commerce"] },
  { name: "Shopify Magic", url: "https://www.shopify.com/magic", category: "Business & Sales", text: "AI for product descriptions and store content.", tags: ["E-commerce", "Products", "Email"] },

  // More chat & research
  { name: "You.com", url: "https://you.com", category: "Education & Research", text: "AI search and research assistant with sources.", tags: ["Search", "Research", "Agents"] },
  { name: "SciSpace", url: "https://scispace.com", category: "Education & Research", text: "Read, explain and find research papers with AI.", tags: ["Papers", "Explain", "Literature"] },
  { name: "Speak", url: "https://www.speak.com", category: "Education & Research", text: "Practise speaking English with an AI tutor.", tags: ["English", "Speaking", "Tutor"] },
  { name: "Mistral Le Chat", url: "https://chat.mistral.ai", category: "Chat Assistants", text: "Fast assistant from Mistral with web search and images.", tags: ["Fast", "Free", "Web search"], badge: "Free plan" },
  { name: "HuggingChat", url: "https://huggingface.co/chat", category: "Chat Assistants", text: "Chat with free open-source AI models.", tags: ["Open source", "Free", "Models"], badge: "Free plan" },
  { name: "Character.AI", url: "https://character.ai", category: "Chat Assistants", text: "Chat with AI characters and create your own.", tags: ["Characters", "Roleplay", "Fun"] },
  { name: "Qwen Chat", url: "https://chat.qwen.ai", category: "Chat Assistants", text: "Alibaba's free assistant for chat, images and code.", tags: ["Free", "Images", "Code"], badge: "Free plan" },

  // More video & image
  { name: "Higgsfield", url: "https://higgsfield.ai", category: "Video", text: "Cinematic camera moves and effects for AI video.", tags: ["Camera moves", "Effects", "Video"], badge: "Trending" },
  { name: "Vidnoz", url: "https://www.vidnoz.com", category: "Video", text: "Free AI avatar and talking-head videos.", tags: ["Avatars", "Free", "Templates"] },
  { name: "Pictory", url: "https://pictory.ai", category: "Video", text: "Turn scripts and blog posts into videos.", tags: ["Script to video", "Stock", "Captions"] },
  { name: "Fliki", url: "https://fliki.ai", category: "Video", text: "Text to video with realistic voiceovers.", tags: ["Text-to-video", "Voices", "Social"] },
  { name: "Submagic", url: "https://www.submagic.co", category: "Video", text: "Viral-style animated captions for shorts.", tags: ["Captions", "Shorts", "B-roll"] },
  { name: "Playground", url: "https://playground.com", category: "Image", text: "Design graphics and images with AI templates.", tags: ["Graphics", "Templates", "Free"] },
  { name: "Recraft", url: "https://www.recraft.ai", category: "Image", text: "Vector art, icons and brand-consistent images.", tags: ["Vectors", "Icons", "Brand styles"] },
  { name: "Freepik AI", url: "https://www.freepik.com/ai", category: "Image", text: "Image, video and upscaling tools in one suite.", tags: ["Suite", "Upscale", "Video"] },
  { name: "Clipdrop", url: "https://clipdrop.co", category: "Image", text: "Quick image edits: relight, clean up, upscale.", tags: ["Edit", "Relight", "Upscale"] },

  // More voice & avatars
  { name: "Resemble AI", url: "https://www.resemble.ai", category: "Voice & Avatars", text: "Voice cloning with deepfake detection.", tags: ["Cloning", "Detection", "API"] },
  { name: "Elai.io", url: "https://elai.io", category: "Voice & Avatars", text: "Training videos with AI presenters from text.", tags: ["Presenters", "Training", "Slides"] },
  { name: "Captions", url: "https://www.captions.ai", category: "Voice & Avatars", text: "AI creators, eye contact fix and auto captions.", tags: ["Creators", "Captions", "Mobile"] },

  // More writing & SEO
  { name: "Anyword", url: "https://www.anyword.com", category: "Writing", text: "Marketing copy with predicted performance scores.", tags: ["Scores", "Ads", "Brand"] },
  { name: "Writer", url: "https://writer.com", category: "Writing", text: "Enterprise AI writing with company style rules.", tags: ["Enterprise", "Style guide", "Agents"] },
  { name: "Wordtune", url: "https://www.wordtune.com", category: "Writing", text: "Rewrite sentences to sound clearer and natural.", tags: ["Rewrite", "Tone", "Summaries"] },
  { name: "Clearscope", url: "https://www.clearscope.io", category: "SEO & Marketing", text: "Content grading for higher search rankings.", tags: ["Grading", "Keywords", "Reports"] },
  { name: "MarketMuse", url: "https://www.marketmuse.com", category: "SEO & Marketing", text: "Content strategy and topic planning with AI.", tags: ["Strategy", "Topics", "Briefs"] },
  { name: "Albert.ai", url: "https://albert.ai", category: "SEO & Marketing", text: "Autonomous AI for running digital ad campaigns.", tags: ["Ads", "Autonomous", "Paid media"] },
  { name: "Ubersuggest", url: "https://neilpatel.com/ubersuggest/", category: "SEO & Marketing", text: "Simple keyword ideas and site audits.", tags: ["Keywords", "Audit", "Free tier"] },
  { name: "Buffer AI", url: "https://buffer.com/ai-assistant", category: "SEO & Marketing", text: "Write and schedule social posts in one place.", tags: ["Scheduling", "Posts", "Free tier"] },

  // More coding
  { name: "BLACKBOX AI", url: "https://www.blackbox.ai", category: "Coding", text: "Coding assistant for chat, autocomplete and agents.", tags: ["Code chat", "Autocomplete", "Agent"] },
  { name: "Google AI Studio", url: "https://aistudio.google.com", category: "Coding", text: "Try Gemini models free and build apps with them.", tags: ["Gemini API", "Free", "Prototypes"], badge: "Free plan" },
  { name: "Codeium", url: "https://codeium.com", category: "Coding", text: "Free AI code completion for many editors.", tags: ["Autocomplete", "Free", "Extensions"] },
  { name: "Firebase Studio", url: "https://firebase.studio", category: "Coding", text: "Google's browser workspace to build full-stack AI apps.", tags: ["Full-stack", "Browser", "Deploy"] },

  // More productivity & design
  { name: "Mem", url: "https://get.mem.ai", category: "Productivity", text: "AI notes that organise themselves.", tags: ["Notes", "Search", "Organise"] },
  { name: "Tome", url: "https://tome.app", category: "Productivity", text: "AI-made stories and presentations.", tags: ["Slides", "Stories", "Pages"] },
  { name: "Galileo AI", url: "https://www.usegalileo.ai", category: "Design & UI", text: "Generate editable UI designs from a prompt.", tags: ["UI", "Prompt", "Figma"] },
  { name: "Dora", url: "https://www.dora.run", category: "Design & UI", text: "Build animated 3D websites with AI.", tags: ["3D", "Websites", "No-code"] },
  { name: "Durable", url: "https://durable.co", category: "Design & UI", text: "A business website built in 30 seconds.", tags: ["Websites", "Small business", "CRM"] },
  { name: "Luzmo", url: "https://www.luzmo.com", category: "Data & Analytics", text: "Embedded analytics dashboards for apps.", tags: ["Embedded", "Dashboards", "SaaS"] },
  { name: "Docparser", url: "https://docparser.com", category: "Automation & Agents", text: "Pull data from PDFs and documents automatically.", tags: ["PDF", "Parsing", "Integrations"] },
  { name: "Browserless", url: "https://www.browserless.io", category: "Automation & Agents", text: "Run browsers in the cloud for automation and agents.", tags: ["Browser", "API", "Scraping"] },
  { name: "Lindy", url: "https://www.lindy.ai", category: "Automation & Agents", text: "AI assistants for email, meetings and support.", tags: ["Assistants", "Email", "No-code"] },
  { name: "Gumloop", url: "https://www.gumloop.com", category: "Automation & Agents", text: "Drag-and-drop AI automations for teams.", tags: ["Workflows", "No-code", "AI"] },
  { name: "Flowise", url: "https://flowiseai.com", category: "Automation & Agents", text: "Open-source builder for AI agents and chatbots.", tags: ["Open source", "LLM apps", "Visual"] },

  // More music
  { name: "Mubert", url: "https://mubert.com", category: "Music & Audio", text: "Endless royalty-free AI music streams.", tags: ["Royalty-free", "Streams", "Creators"] },
  { name: "Boomy", url: "https://boomy.com", category: "Music & Audio", text: "Make songs in seconds and release them.", tags: ["Songs", "Release", "Easy"] },
  { name: "AIVA", url: "https://www.aiva.ai", category: "Music & Audio", text: "AI composer for soundtracks and themes.", tags: ["Composer", "Soundtracks", "MIDI"] },

  // More business & sales
  { name: "PandaDoc AI", url: "https://www.pandadoc.com", category: "Business & Sales", text: "Proposals and contracts written and sent with AI.", tags: ["Proposals", "E-sign", "Contracts"] },
  { name: "Regie.ai", url: "https://www.regie.ai", category: "Business & Sales", text: "AI agents for sales prospecting.", tags: ["Prospecting", "Agents", "Email"] },
  { name: "Humantic AI", url: "https://humantic.ai", category: "Business & Sales", text: "Buyer personality insights for sales calls.", tags: ["Personality", "Insights", "Sales"] },
  { name: "Outplay", url: "https://outplayhq.com", category: "Business & Sales", text: "Multichannel sales outreach with AI.", tags: ["Outreach", "Sequences", "Email"] },
  { name: "Klenty", url: "https://www.klenty.com", category: "Business & Sales", text: "Sales engagement and email cadences.", tags: ["Cadences", "Email", "CRM"] },

  // Security
  { name: "Darktrace", url: "https://darktrace.com", category: "Security", text: "Self-learning AI that detects cyber threats.", tags: ["Threats", "Network", "Enterprise"] },
  { name: "SentinelOne", url: "https://www.sentinelone.com", category: "Security", text: "AI endpoint protection against malware and attacks.", tags: ["Endpoint", "EDR", "Purple AI"] },
  { name: "CrowdStrike", url: "https://www.crowdstrike.com", category: "Security", text: "AI-native platform that stops breaches.", tags: ["Endpoint", "Cloud", "Threat intel"] },
  { name: "Huntress", url: "https://www.huntress.com", category: "Security", text: "Managed threat detection for small businesses.", tags: ["SMB", "Managed", "EDR"] },
  { name: "CrowdSec", url: "https://www.crowdsec.net", category: "Security", text: "Free, crowd-powered protection for servers.", tags: ["Open source", "Servers", "Free"] },
  { name: "UpGuard", url: "https://www.upguard.com", category: "Security", text: "Monitor data leaks and vendor security risk.", tags: ["Risk", "Leaks", "Vendors"] },

  // Utilities
  { name: "Cleanup.pictures", url: "https://cleanup.pictures", category: "Utilities", text: "Erase objects, people or text from photos.", tags: ["Erase", "Photos", "Free"] },
  { name: "Upscale.media", url: "https://www.upscale.media", category: "Utilities", text: "Upscale and sharpen images up to 4x.", tags: ["Upscale", "Enhance", "Free"] },
  { name: "TinyWow", url: "https://tinywow.com", category: "Utilities", text: "Free PDF, image, video and writing tools.", tags: ["PDF", "Converters", "Free"], badge: "Free plan" },
  { name: "iLovePDF", url: "https://www.ilovepdf.com", category: "Utilities", text: "Merge, split, compress and convert PDFs.", tags: ["PDF", "Convert", "Free"] },
  { name: "Photoroom", url: "https://www.photoroom.com", category: "Utilities", text: "Product photos with clean backgrounds.", tags: ["Product photos", "Background", "Mobile"] },
  { name: "Let's Enhance", url: "https://letsenhance.io", category: "Utilities", text: "Increase image resolution without losing quality.", tags: ["Upscale", "Print", "Batch"] },
  { name: "TurboScribe", url: "https://turboscribe.ai", category: "Utilities", text: "Transcribe audio and video to text, including Urdu.", tags: ["Transcribe", "Urdu", "Free tier"] },
];
