use tracing_subscriber::{fmt, EnvFilter};

pub fn init_default_logger() {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env().add_directive("info".parse().unwrap()))
        .init();
}

pub fn init_logger(level: &str) {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::new(level))
        .init();
}

pub fn init_logger_with_target(level: &str, target: &str) {
    let filter = EnvFilter::new(level)
        .add_directive(format!("{}={}", target, level).parse().unwrap());

    tracing_subscriber::fmt()
        .with_env_filter(filter)
        .init();
}
