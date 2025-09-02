use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OllamaConfig {
    pub base_url: String,
    pub model: String,
    pub timeout_seconds: u64,
    pub max_tokens: Option<u32>,
    pub temperature: Option<f32>,
}

impl Default for OllamaConfig {
    fn default() -> Self {
        Self {
            base_url: "http://localhost:11434".to_string(),
            model: "llama2".to_string(),
            timeout_seconds: 300,
            max_tokens: Some(4096),
            temperature: Some(0.7),
        }
    }
}

impl OllamaConfig {
    pub fn api_url(&self) -> String {
        format!("{}/api", self.base_url)
    }

    pub fn generate_url(&self) -> String {
        format!("{}/api/generate", self.base_url)
    }

    pub fn chat_url(&self) -> String {
        format!("{}/api/chat", self.base_url)
    }

    pub fn from_env() -> anyhow::Result<Self> {
        Ok(Self {
            base_url: std::env::var("OLLAMA_BASE_URL")
                .unwrap_or_else(|_| "http://localhost:11434".to_string()),
            model: std::env::var("OLLAMA_MODEL").unwrap_or_else(|_| "llama2".to_string()),
            timeout_seconds: std::env::var("OLLAMA_TIMEOUT")
                .unwrap_or_else(|_| "300".to_string())
                .parse()
                .unwrap_or(300),
            max_tokens: std::env::var("OLLAMA_MAX_TOKENS")
                .ok()
                .and_then(|s| s.parse().ok()),
            temperature: std::env::var("OLLAMA_TEMPERATURE")
                .ok()
                .and_then(|s| s.parse().ok()),
        })
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OllamaRequest {
    pub model: String,
    pub prompt: String,
    pub stream: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_tokens: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<f32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OllamaResponse {
    pub model: String,
    pub created_at: String,
    pub response: String,
    pub done: bool,
}
