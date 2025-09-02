use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RedisConfig {
    pub host: String,
    pub port: u16,
    pub password: Option<String>,
    pub database: u8,
    pub max_connections: u32,
    pub timeout_seconds: u64,
}

impl Default for RedisConfig {
    fn default() -> Self {
        Self {
            host: "localhost".to_string(),
            port: 6379,
            password: None,
            database: 0,
            max_connections: 10,
            timeout_seconds: 30,
        }
    }
}

impl RedisConfig {
    pub fn connection_string(&self) -> String {
        match &self.password {
            Some(pwd) => format!("redis://:{}@{}:{}/{}", pwd, self.host, self.port, self.database),
            None => format!("redis://{}:{}/{}", self.host, self.port, self.database),
        }
    }

    pub fn from_env() -> anyhow::Result<Self> {
        Ok(Self {
            host: std::env::var("REDIS_HOST").unwrap_or_else(|_| "localhost".to_string()),
            port: std::env::var("REDIS_PORT")
                .unwrap_or_else(|_| "6379".to_string())
                .parse()?,
            password: std::env::var("REDIS_PASSWORD").ok(),
            database: std::env::var("REDIS_DB")
                .unwrap_or_else(|_| "0".to_string())
                .parse()
                .unwrap_or(0),
            max_connections: std::env::var("REDIS_MAX_CONNECTIONS")
                .unwrap_or_else(|_| "10".to_string())
                .parse()
                .unwrap_or(10),
            timeout_seconds: std::env::var("REDIS_TIMEOUT")
                .unwrap_or_else(|_| "30".to_string())
                .parse()
                .unwrap_or(30),
        })
    }
}
