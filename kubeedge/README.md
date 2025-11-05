# KubeEdge Deployment Guide for Verse

This guide will help you deploy the Verse application using KubeEdge for edge computing capabilities.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Installation Steps](#installation-steps)
4. [Building Docker Images](#building-docker-images)
5. [Deploying to KubeEdge](#deploying-to-kubeedge)
6. [Configuration](#configuration)
7. [Monitoring and Troubleshooting](#monitoring-and-troubleshooting)

## Prerequisites

### Cloud Node (Master)
- Kubernetes cluster (v1.24+) running on the cloud node
- `kubectl` configured with cluster access
- At least 4GB RAM and 2 CPUs
- Ports 10000, 10002 accessible for edge nodes

### Edge Nodes (Workers)
- Linux-based OS (Ubuntu 20.04+ recommended)
- Docker installed
- At least 2GB RAM and 1 CPU
- Network connectivity to cloud node

### Tools Required
- Docker (20.10+)
- kubectl (1.24+)
- keadm (KubeEdge installation tool)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Cloud Node (Master)                     │
│  ┌────────────┐  ┌──────────┐  ┌────────┐  ┌──────────┐   │
│  │ CloudCore  │  │PostgreSQL│  │ MinIO  │  │ LiveKit  │   │
│  └────────────┘  └──────────┘  └────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                    ┌───────┴───────┐
                    │               │
            ┌───────▼─────┐ ┌───────▼─────┐
            │ Edge Node 1 │ │ Edge Node 2 │
            │ ┌─────────┐ │ │ ┌─────────┐ │
            │ │ Client  │ │ │ │ Server  │ │
            │ └─────────┘ │ │ └─────────┘ │
            │ ┌─────────┐ │ │ ┌─────────┐ │
            │ │Captions │ │ │ │Captions │ │
            │ └─────────┘ │ │ └─────────┘ │
            └─────────────┘ └─────────────┘
```

### Component Distribution

**Cloud Node (Stateful Services):**
- PostgreSQL (Database)
- MinIO (Object Storage)
- LiveKit (WebRTC Server)
- Redis (Cache)

**Edge Nodes (Stateless Services):**
- Verse Client (Frontend)
- Verse Server (Backend API)
- Verse Captions (AI Processing)

## Installation Steps

### Step 1: Install Keadm

On both cloud and edge nodes:

```bash
# Download keadm
wget https://github.com/kubeedge/kubeedge/releases/download/v1.17.0/keadm-v1.17.0-linux-amd64.tar.gz

# Extract
tar -zxvf keadm-v1.17.0-linux-amd64.tar.gz

# Install
sudo cp keadm-v1.17.0-linux-amd64/keadm/keadm /usr/local/bin/keadm
sudo chmod +x /usr/local/bin/keadm
```

### Step 2: Setup Cloud Node (Master)

On your Kubernetes master node:

```bash
# Get your cloud node's public IP
export CLOUD_IP=$(curl -s ifconfig.me)

# Initialize CloudCore
sudo keadm init --advertise-address="${CLOUD_IP}" \
  --kubeedge-version=v1.17.0 \
  --kube-config=$HOME/.kube/config

# Verify CloudCore is running
kubectl get pods -n kubeedge

# Expected output:
# NAME                             READY   STATUS    RESTARTS   AGE
# cloudcore-56b8454784-xxxxx       1/1     Running   0          1m
```

### Step 3: Get Join Token

On the cloud node:

```bash
# Get token for edge nodes to join
sudo keadm gettoken --kube-config=$HOME/.kube/config

# Save this token - you'll need it for edge nodes
```

### Step 4: Setup Edge Nodes

On each edge node:

```bash
# Replace with your cloud node IP and token
export CLOUD_IP="YOUR_CLOUD_NODE_IP"
export JOIN_TOKEN="YOUR_JOIN_TOKEN_FROM_STEP_3"

# Join the edge node to the cluster
sudo keadm join \
  --cloudcore-ipport="${CLOUD_IP}:10000" \
  --token="${JOIN_TOKEN}" \
  --kubeedge-version=v1.17.0

# Verify edgecore is running
sudo systemctl status edgecore
```

### Step 5: Verify Edge Nodes

On the cloud node:

```bash
# Check if edge nodes are registered
kubectl get nodes

# You should see your edge nodes listed
# NAME         STATUS   ROLES        AGE   VERSION
# master       Ready    control-plane 10m   v1.28.0
# edge-node-1  Ready    agent         2m    v1.28.0-kubeedge-v1.17.0
# edge-node-2  Ready    agent         1m    v1.28.0-kubeedge-v1.17.0
```

## Building Docker Images

Build all Docker images on a machine with Docker installed:

```bash
cd /path/to/verse

# Build client image
docker build -f apps/client/Dockerfile -t verse/client:latest .

# Build server image
docker build -f apps/server/Dockerfile -t verse/server:latest .

# Build captions image
docker build -f apps/captions/Dockerfile -t verse/captions:latest .

# Tag images (optional - for registry)
docker tag verse/client:latest your-registry.com/verse/client:latest
docker tag verse/server:latest your-registry.com/verse/server:latest
docker tag verse/captions:latest your-registry.com/verse/captions:latest

# Push to registry (if using)
docker push your-registry.com/verse/client:latest
docker push your-registry.com/verse/server:latest
docker push your-registry.com/verse/captions:latest
```

### Alternative: Build on Each Node

If not using a container registry, build images on each node where they'll run:

```bash
# On edge nodes, copy the project and build
scp -r verse edge-node:/tmp/

# SSH to edge node and build
ssh edge-node
cd /tmp/verse
docker build -f apps/client/Dockerfile -t verse/client:latest .
docker build -f apps/server/Dockerfile -t verse/server:latest .
docker build -f apps/captions/Dockerfile -t verse/captions:latest .
```

## Deploying to KubeEdge

### Step 1: Update Secrets

Edit `kubeedge/cloud/secrets.yaml` and update all credentials:

```bash
cd verse/kubeedge

# Edit secrets with your actual values
nano cloud/secrets.yaml

# Important: Update these values:
# - DATABASE_URL
# - LIVEKIT_API_KEY and LIVEKIT_API_SECRET
# - JWT_SECRET
# - DEEPGRAM_API_KEY
# - MINIO credentials
```

### Step 2: Deploy Namespace and Secrets

```bash
# Create namespace
kubectl apply -f namespace.yaml

# Deploy secrets
kubectl apply -f cloud/secrets.yaml

# Deploy ConfigMaps
kubectl apply -f cloud/client-configmap.yaml
```

### Step 3: Deploy Cloud Services (Stateful)

Deploy database and storage services on the cloud node:

```bash
# Deploy PostgreSQL
kubectl apply -f cloud/postgres.yaml

# Wait for PostgreSQL to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n verse --timeout=300s

# Deploy MinIO
kubectl apply -f cloud/minio.yaml

# Wait for MinIO
kubectl wait --for=condition=ready pod -l app=minio -n verse --timeout=300s

# Deploy LiveKit and Redis
kubectl apply -f cloud/livekit.yaml

# Wait for LiveKit
kubectl wait --for=condition=ready pod -l app=livekit -n verse --timeout=300s
```

### Step 4: Deploy Edge Services (Stateless)

Deploy application services on edge nodes:

```bash
# Deploy Server
kubectl apply -f edge/server.yaml

# Wait for server
kubectl wait --for=condition=ready pod -l app=verse-server -n verse --timeout=300s

# Deploy Client
kubectl apply -f edge/client.yaml

# Wait for client
kubectl wait --for=condition=ready pod -l app=verse-client -n verse --timeout=300s

# Deploy Captions
kubectl apply -f edge/captions.yaml

# Wait for captions
kubectl wait --for=condition=ready pod -l app=verse-captions -n verse --timeout=300s
```

### Step 5: Verify Deployment

```bash
# Check all pods
kubectl get pods -n verse

# Check services
kubectl get svc -n verse

# Check deployments
kubectl get deployments -n verse

# Expected output - all pods should be Running
# NAME                              READY   STATUS    RESTARTS   AGE
# postgres-xxxxxxxxx-xxxxx          1/1     Running   0          5m
# minio-xxxxxxxxx-xxxxx             1/1     Running   0          4m
# redis-xxxxxxxxx-xxxxx             1/1     Running   0          3m
# livekit-xxxxxxxxx-xxxxx           1/1     Running   0          3m
# verse-server-xxxxxxxxx-xxxxx      1/1     Running   0          2m
# verse-server-xxxxxxxxx-yyyyy      1/1     Running   0          2m
# verse-client-xxxxxxxxx-xxxxx      1/1     Running   0          1m
# verse-client-xxxxxxxxx-yyyyy      1/1     Running   0          1m
# verse-captions-xxxxxxxxx-xxxxx    1/1     Running   0          1m
```

## Configuration

### Node Affinity (Optional)

To ensure services run on specific nodes, add node labels:

```bash
# Label cloud node
kubectl label nodes master-node node-type=cloud

# Label edge nodes
kubectl label nodes edge-node-1 node-type=edge
kubectl label nodes edge-node-2 node-type=edge
```

Then update deployments to use node affinity:

```yaml
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: node-type
            operator: In
            values:
            - cloud  # or edge
```

### Accessing Services

#### Via NodePort (Development)

Services are exposed via NodePort:

- Client: `http://<EDGE_NODE_IP>:30080`
- Server API: `http://<EDGE_NODE_IP>:30300`
- LiveKit: `ws://<CLOUD_NODE_IP>:30880`
- MinIO Console: `http://<CLOUD_NODE_IP>:30001`

#### Via Ingress (Production)

For production, set up an Ingress controller:

```bash
# Install nginx-ingress
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

# Create ingress resource (see ingress-example.yaml)
```

### Database Migrations

Run database migrations after PostgreSQL is ready:

```bash
# Get server pod name
POD_NAME=$(kubectl get pod -n verse -l app=verse-server -o jsonpath="{.items[0].metadata.name}")

# Run migrations
kubectl exec -n verse $POD_NAME -- npm run db:push
```

## Monitoring and Troubleshooting

### View Logs

```bash
# View logs for a specific pod
kubectl logs -n verse <pod-name>

# Follow logs
kubectl logs -n verse <pod-name> -f

# View previous logs (if po
