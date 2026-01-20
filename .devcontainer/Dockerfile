# Smart Campus Navigation System - Dev Container
# Base image with common development tools
FROM mcr.microsoft.com/devcontainers/base:ubuntu-22.04

# Avoid prompts during package installation
ARG DEBIAN_FRONTEND=noninteractive

# Install additional OS packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Build essentials
    build-essential \
    # Network tools
    curl \
    wget \
    netcat-openbsd \
    # Process management
    htop \
    # JSON processing
    jq \
    # File watching (for hot reload)
    inotify-tools \
    # SSL/TLS
    ca-certificates \
    openssl \
    # Fonts (for QR code generation)
    fonts-liberation \
    # Clean up
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create workspace directory
RUN mkdir -p /workspaces

# Set working directory
WORKDIR /workspaces

# Default user (will be overridden by devcontainer.json)
USER vscode
