#!/bin/bash

# Complete KubeEdge Setup and Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="verse"
KUBEEDGE_VERSION="v1.17.0"
KUBEEDGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${KUBEEDGE_DIR}/.." && pwd)"
# Get IP address based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    CLOUD_NODE_IP="${CLOUD_NODE_IP:-$(ipconfig getifaddr en0 2>/dev/null || echo "127.0.0.1")}"
else
    CLOUD_NODE_IP="${CLOUD_NODE_IP:-$(hostname -I | awk '{print $1}')}"
fi

# Detect container runtime
CONTAINER_RUNTIME=""
if command_exists podman; then
    CONTAINER_RUNTIME="podman"
elif command_exists docker; then
    CONTAINER_RUNTIME="docker"
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Verse KubeEdge Complete Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Function to install kubectl
install_kubectl() {
    echo -e "${YELLOW}Installing kubectl...${NC}"

    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command_exists brew; then
            brew install kubectl
        else
            curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/darwin/amd64/kubectl"
            chmod +x kubectl
            sudo mv kubectl /usr/local/bin/
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
        chmod +x kubectl
        sudo mv kubectl /usr/local/bin/
    fi

    echo -e "${GREEN}✓ kubectl installed${NC}"
}

# Function to install keadm
install_keadm() {
    echo -e "${YELLOW}Installing keadm...${NC}"

    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS: keadm binary not available, use Docker/Podman wrapper
        echo -e "${YELLOW}Note: keadm native binary not available for macOS${NC}"
        echo -e "${YELLOW}Creating container-based keadm wrapper...${NC}"

        # Detect container runtime
        CONTAINER_RUNTIME=""
        if command_exists podman; then
            CONTAINER_RUNTIME="podman"
            echo -e "${GREEN}✓ Using Podman${NC}"
        elif command_exists docker; then
            CONTAINER_RUNTIME="docker"
            echo -e "${GREEN}✓ Using Docker${NC}"
        else
            echo -e "${RED}✗ Either Docker or Podman is required for keadm on macOS${NC}"
            echo -e "${YELLOW}Please install one of:${NC}"
            echo -e "${YELLOW}  - Docker Desktop: https://www.docker.com/products/docker-desktop${NC}"
            echo -e "${YELLOW}  - Podman: brew install podman${NC}"
            exit 1
        fi

        # Create a wrapper script that uses container runtime
        sudo tee /usr/local/bin/keadm > /dev/null << 'WRAPPER_EOF'
#!/bin/bash
# KubeEdge keadm container wrapper for macOS
KUBEEDGE_VERSION="${KUBEEDGE_VERSION:-v1.17.0}"
CONTAINER_RUNTIME="CONTAINER_RUNTIME_PLACEHOLDER"

# Get the real HOME directory (not root's)
REAL_HOME="${HOME}"
USER_HOME=$(eval echo ~$USER)
MINIKUBE_DIR="${USER_HOME}/.minikube"
KUBE_DIR="${USER_HOME}/.kube"

# Handle gettoken command specially
if [[ "$1" == "gettoken" ]]; then
    KUBECONFIG_PATH="${KUBE_CONFIG:-${KUBECONFIG:-${USER_HOME}/.kube/config}}"
    $CONTAINER_RUNTIME run --rm \
        -v "$KUBECONFIG_PATH:${USER_HOME}/.kube/config:ro" \
        -v "$MINIKUBE_DIR:${USER_HOME}/.minikube:ro" \
        -e "HOME=${USER_HOME}" \
        kubeedge/installation-package:${KUBEEDGE_VERSION} \
        keadm "$@" --kube-config="${USER_HOME}/.kube/config"
else
    # For init and other commands
    KUBECONFIG_PATH="${KUBE_CONFIG:-${KUBECONFIG:-${USER_HOME}/.kube/config}}"
    $CONTAINER_RUNTIME run --rm --network host \
        -v "$KUBECONFIG_PATH:${USER_HOME}/.kube/config:ro" \
        -v "$MINIKUBE_DIR:${USER_HOME}/.minikube:ro" \
        -e "HOME=${USER_HOME}" \
        kubeedge/installation-package:${KUBEEDGE_VERSION} \
        keadm "$@"
fi
WRAPPER_EOF
        # Replace placeholder with actual container runtime
        sudo sed -i.bak "s/CONTAINER_RUNTIME_PLACEHOLDER/${CONTAINER_RUNTIME}/g" /usr/local/bin/keadm
        sudo rm /usr/local/bin/keadm.bak 2>/dev/null || true
        sudo chmod +x /usr/local/bin/keadm

        # Pull the keadm container image
        echo -e "${YELLOW}Pulling keadm container image...${NC}"
        $CONTAINER_RUNTIME pull kubeedge/installation-package:${KUBEEDGE_VERSION}

        echo -e "${GREEN}✓ keadm wrapper installed (using ${CONTAINER_RUNTIME})${NC}"
        echo -e "${YELLOW}Note: keadm commands will run inside containers${NC}"
    else
        # Linux
        ARCH="amd64"
        if [[ $(uname -m) == "aarch64" ]]; then
            ARCH="arm64"
        fi
        curl -LO "https://github.com/kubeedge/kubeedge/releases/download/${KUBEEDGE_VERSION}/keadm-${KUBEEDGE_VERSION}-linux-${ARCH}.tar.gz"
        tar -zxvf "keadm-${KUBEEDGE_VERSION}-linux-${ARCH}.tar.gz"
        sudo mv "keadm-${KUBEEDGE_VERSION}-linux-${ARCH}/keadm/keadm" /usr/local/bin/
        rm -rf "keadm-${KUBEEDGE_VERSION}-linux-${ARCH}"*
        echo -e "${GREEN}✓ keadm installed${NC}"
    fi
}

# Function to setup local Kubernetes cluster
setup_kubernetes() {
    echo -e "${BLUE}Setting up Kubernetes cluster...${NC}"

    if command_exists k3s; then
        echo -e "${GREEN}✓ k3s already installed${NC}"
    elif command_exists minikube; then
        echo -e "${GREEN}✓ minikube found${NC}"
        if ! minikube status &> /dev/null; then
            echo -e "${YELLOW}Starting minikube...${NC}"
            # Use podman driver if available, otherwise docker
            if command_exists podman; then
                minikube start --driver=podman --memory=4096 --cpus=2
            else
                minikube start --driver=docker --memory=4096 --cpus=2
            fi
        fi
    elif command_exists kind; then
        echo -e "${GREEN}✓ kind found${NC}"
        if ! kind get clusters | grep -q "kind"; then
            echo -e "${YELLOW}Creating kind cluster...${NC}"
            kind create cluster --name kubeedge
        fi
    else
        echo -e "${YELLOW}No Kubernetes cluster found. Installing k3s...${NC}"
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            curl -sfL https://get.k3s.io | sh -s - --write-kubeconfig-mode 644
            export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
            echo "export KUBECONFIG=/etc/rancher/k3s/k3s.yaml" >> ~/.bashrc
        else
            echo -e "${RED}Please install a Kubernetes cluster on macOS${NC}"
            echo -e "${YELLOW}Options:${NC}"
            echo -e "${YELLOW}  - minikube: brew install minikube${NC}"
            echo -e "${YELLOW}  - kind: brew install kind${NC}"
            echo -e "${YELLOW}  - Docker Desktop with Kubernetes enabled${NC}"
            exit 1
        fi
    fi

    echo -e "${GREEN}✓ Kubernetes cluster ready${NC}"
}

# Function to check cluster connection
check_cluster() {
    echo -e "${YELLOW}Checking cluster connection...${NC}"

    if ! kubectl cluster-info &> /dev/null; then
        echo -e "${RED}✗ Cannot connect to Kubernetes cluster${NC}"
        echo -e "${YELLOW}Please ensure your Kubernetes cluster is running${NC}"
        exit 1
    fi

    echo -e "${GREEN}✓ Connected to Kubernetes cluster${NC}"
    kubectl cluster-info
}

# Function to initialize KubeEdge cloudcore
init_kubeedge_cloud() {
    echo -e "${BLUE}Initializing KubeEdge CloudCore...${NC}"

    # Get kubeconfig path
    KUBECONFIG_PATH="${KUBECONFIG:-$HOME/.kube/config}"

    echo -e "${YELLOW}Using advertise address: ${CLOUD_NODE_IP}${NC}"

    if kubectl get namespace kubeedge &> /dev/null; then
        echo -e "${YELLOW}KubeEdge namespace already exists, skipping init...${NC}"
    else
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS: Set environment variable for wrapper script
            export KUBE_CONFIG="${KUBECONFIG_PATH}"
            export KUBEEDGE_VERSION="${KUBEEDGE_VERSION}"
            keadm init \
                --advertise-address="${CLOUD_NODE_IP}" \
                --kubeedge-version="${KUBEEDGE_VERSION}" \
                --kube-config="${KUBECONFIG_PATH}" \
                --set server.advertiseAddress="${CLOUD_NODE_IP}"
        else
            # Linux: Use sudo
            sudo keadm init \
                --advertise-address="${CLOUD_NODE_IP}" \
                --kubeedge-version="${KUBEEDGE_VERSION}" \
                --kube-config="${KUBECONFIG_PATH}" \
                --set server.advertiseAddress="${CLOUD_NODE_IP}"
        fi
    fi

    echo -e "${GREEN}✓ KubeEdge CloudCore initialized${NC}"
}

# Function to wait for deployment
wait_for_deployment() {
    local deployment=$1
    local namespace=$2
    local timeout=${3:-300}

    echo -e "${YELLOW}Waiting for deployment ${deployment} to be ready...${NC}"
    if kubectl wait --for=condition=available --timeout=${timeout}s deployment/${deployment} -n ${namespace} 2>/dev/null; then
        echo -e "${GREEN}✓ ${deployment} is ready${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ ${deployment} is taking longer than expected${NC}"
        kubectl get pods -n ${namespace} | grep ${deployment} || true
        return 1
    fi
}

# Function to apply manifests
apply_manifest() {
    local file=$1
    local description=$2

    if [[ ! -f "$file" ]]; then
        echo -e "${YELLOW}⚠ File not found: ${file}, skipping...${NC}"
        return 0
    fi

    echo -e "${YELLOW}Applying ${description}...${NC}"
    if kubectl apply -f "$file"; then
        echo -e "${GREEN}✓ ${description} applied successfully${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}✗ Failed to apply ${description}${NC}"
        return 1
    fi
}

# Function to check if image exists in minikube
image_exists_in_minikube() {
    local image=$1
    minikube image ls 2>/dev/null | grep -q "$image"
}

# Function to check if image exists locally
image_exists_locally() {
    local image=$1
    if [[ -n "$CONTAINER_RUNTIME" ]]; then
        $CONTAINER_RUNTIME images | grep -q "$image" || $CONTAINER_RUNTIME image exists "$image" 2>/dev/null
    else
        return 1
    fi
}

# Function to build and load images
build_and_load_images() {
    echo -e "${BLUE}Checking and building application images...${NC}"

    if [[ -z "$CONTAINER_RUNTIME" ]]; then
        echo -e "${YELLOW}⚠ No container runtime (docker/podman) found${NC}"
        echo -e "${YELLOW}  Skipping image build. Images must be available in cluster.${NC}"
        return 0
    fi

    local images_to_build=()
    local using_minikube=false

    # Check if using minikube
    if command_exists minikube && minikube status &> /dev/null; then
        using_minikube=true
        echo -e "${GREEN}✓ Minikube detected${NC}"
    fi

    # Check verse-server image
    if $using_minikube && ! image_exists_in_minikube "verse/server:latest"; then
        images_to_build+=("server")
    elif ! $using_minikube && ! image_exists_locally "verse/server:latest"; then
        images_to_build+=("server")
    else
        echo -e "${GREEN}✓ verse-server image exists${NC}"
    fi

    # Check verse-client image
    if $using_minikube && ! image_exists_in_minikube "verse/client:latest"; then
        images_to_build+=("client")
    elif ! $using_minikube && ! image_exists_locally "verse/client:latest"; then
        images_to_build+=("client")
    else
        echo -e "${GREEN}✓ verse-client image exists${NC}"
    fi

    # Check verse-captions image
    if $using_minikube && ! image_exists_in_minikube "verse/captions:latest"; then
        images_to_build+=("captions")
    elif ! $using_minikube && ! image_exists_locally "verse/captions:latest"; then
        images_to_build+=("captions")
    else
        echo -e "${GREEN}✓ verse-captions image exists${NC}"
    fi

    # Build missing images
    if [[ ${#images_to_build[@]} -gt 0 ]]; then
        echo -e "${YELLOW}Building missing images: ${images_to_build[*]}${NC}"

        for app in "${images_to_build[@]}"; do
            echo -e "${YELLOW}Building verse-${app}...${NC}"

            local dockerfile="${PROJECT_ROOT}/apps/${app}/Dockerfile"
            if [[ ! -f "$dockerfile" ]]; then
                echo -e "${YELLOW}⚠ Dockerfile not found: ${dockerfile}${NC}"
                echo -e "${YELLOW}  Skipping ${app}${NC}"
                continue
            fi

            # Build image
            if $CONTAINER_RUNTIME build -t "verse/${app}:latest" -f "$dockerfile" "${PROJECT_ROOT}"; then
                echo -e "${GREEN}✓ Built verse-${app}:latest${NC}"

                # Load into minikube if needed
                if $using_minikube; then
                    echo -e "${YELLOW}Loading verse-${app} into minikube...${NC}"
                    if $CONTAINER_RUNTIME save "localhost/verse/${app}:latest" | minikube image load -; then
                        echo -e "${GREEN}✓ Loaded verse-${app} into minikube${NC}"
                    else
                        # Try alternative method
                        minikube image load "verse/${app}:latest" 2>/dev/null || \
                        $CONTAINER_RUNTIME save "verse/${app}:latest" | minikube image load - || \
                        echo -e "${YELLOW}⚠ Could not load image into minikube, trying direct build${NC}"
                        minikube image build -t "verse/${app}:latest" -f "$dockerfile" "${PROJECT_ROOT}" || true
                    fi
                fi
            else
                echo -e "${RED}✗ Failed to build verse-${app}${NC}"
            fi
        done
        echo ""
    else
        echo -e "${GREEN}✓ All application images exist${NC}"
    fi
}

# Function to deploy coturn
deploy_coturn() {
    echo -e "${BLUE}Deploying Coturn TURN Server...${NC}"

    apply_manifest "${KUBEEDGE_DIR}/cloud/coturn-configmap.yaml" "Coturn ConfigMap"
    apply_manifest "${KUBEEDGE_DIR}/cloud/coturn.yaml" "Coturn Deployment"

    echo -e "${YELLOW}Waiting for Coturn to be ready...${NC}"
    wait_for_deployment "coturn" "${NAMESPACE}" 120 || true
    echo ""
}

# Function to get edge token
get_edge_token() {
    echo -e "${BLUE}Getting edge node token...${NC}"

    local token
    # Try to get token directly from kubectl
    token=$(kubectl get secret tokensecret -n kubeedge -o jsonpath='{.data.tokendata}' 2>/dev/null | base64 -d 2>/dev/null || echo "")

    if [[ -z "$token" ]]; then
        echo -e "${YELLOW}⚠ Could not get token automatically${NC}"
        echo -e "${YELLOW}Run this command on cloud node to get token:${NC}"
        echo -e "${CYAN}kubectl get secret tokensecret -n kubeedge -o jsonpath='{.data.tokendata}' | base64 -d${NC}"
        echo ""
    else
        echo -e "${GREEN}✓ Edge Node Join Token retrieved:${NC}"
        echo -e "${CYAN}${token}${NC}"
        echo ""
        echo -e "${YELLOW}To join edge node, run on edge machine:${NC}"
        echo -e "${CYAN}sudo keadm join --cloudcore-ipport=${CLOUD_NODE_IP}:10000 --token=${token} --kubeedge-version=${KUBEEDGE_VERSION}${NC}"
        echo ""
    fi
}

# Main deployment process
main() {
    echo -e "${BLUE}Step 1: Checking prerequisites...${NC}"

    # Check and install kubectl
    if ! command_exists kubectl; then
        install_kubectl
    else
        echo -e "${GREEN}✓ kubectl is installed: $(kubectl version --client --short 2>/dev/null || kubectl version --client)${NC}"
    fi

    # Check and install keadm
    if ! command_exists keadm; then
        install_keadm
    else
        echo -e "${GREEN}✓ keadm is installed${NC}"
    fi
    echo ""

    echo -e "${BLUE}Step 2: Setting up Kubernetes cluster...${NC}"
    setup_kubernetes
    sleep 5
    check_cluster
    echo ""

    echo -e "${BLUE}Step 3: Initializing KubeEdge CloudCore...${NC}"
    init_kubeedge_cloud
    echo ""

    echo -e "${BLUE}Step 4: Waiting for CloudCore to be ready...${NC}"
    sleep 10
    kubectl wait --for=condition=available --timeout=180s deployment/cloudcore -n kubeedge 2>/dev/null || true
    kubectl get all -n kubeedge
    echo ""

    echo -e "${BLUE}Step 5: Creating application namespaces...${NC}"
    apply_manifest "${KUBEEDGE_DIR}/namespace.yaml" "Namespaces"

    echo -e "${BLUE}Step 6: Creating secrets...${NC}"
    echo -e "${YELLOW}⚠ IMPORTANT: Please update secrets in ${KUBEEDGE_DIR}/cloud/secrets.yaml before production!${NC}"
    read -p "Press Enter to continue with default secrets (for testing only)..." || true
    apply_manifest "${KUBEEDGE_DIR}/cloud/secrets.yaml" "Secrets"

    echo -e "${BLUE}Step 7: Creating ConfigMaps...${NC}"
    apply_manifest "${KUBEEDGE_DIR}/cloud/client-configmap.yaml" "Client ConfigMap"

    echo -e "${BLUE}Step 8: Building and loading application images...${NC}"
    build_and_load_images

    echo -e "${BLUE}Step 9: Deploying Coturn TURN Server...${NC}"
    deploy_coturn

    echo -e "${BLUE}Step 10: Deploying infrastructure (PostgreSQL, MinIO, Redis, LiveKit)...${NC}"
    apply_manifest "${KUBEEDGE_DIR}/cloud/postgres.yaml" "PostgreSQL"
    apply_manifest "${KUBEEDGE_DIR}/cloud/minio.yaml" "MinIO"
    apply_manifest "${KUBEEDGE_DIR}/cloud/livekit.yaml" "LiveKit & Redis"

    echo -e "${BLUE}Step 11: Waiting for infrastructure to be ready...${NC}"
    wait_for_deployment "postgres" "${NAMESPACE}" 180 || true
    wait_for_deployment "minio" "${NAMESPACE}" 180 || true
    wait_for_deployment "redis" "${NAMESPACE}" 180 || true
    wait_for_deployment "livekit" "${NAMESPACE}" 180 || true
    echo ""

    echo -e "${BLUE}Step 12: Deploying applications (Server, Client, Captions)...${NC}"
    apply_manifest "${KUBEEDGE_DIR}/edge/server.yaml" "Verse Server"
    apply_manifest "${KUBEEDGE_DIR}/edge/client.yaml" "Verse Client"
    apply_manifest "${KUBEEDGE_DIR}/edge/captions.yaml" "Verse Captions"

    echo -e "${BLUE}Step 13: Waiting for applications to be ready...${NC}"
    wait_for_deployment "verse-server" "${NAMESPACE}" 180 || true
    wait_for_deployment "verse-client" "${NAMESPACE}" 180 || true
    wait_for_deployment "verse-captions" "${NAMESPACE}" 180 || true
    echo ""

    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Deployment Complete!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""

    echo -e "${BLUE}Deployment Status:${NC}"
    kubectl get all -n ${NAMESPACE}
    echo ""

    echo -e "${BLUE}KubeEdge Status:${NC}"
    kubectl get all -n kubeedge
    echo ""

    echo -e "${BLUE}Access Points (replace <NODE_IP> with your node IP):${NC}"
    echo -e "  Cloud Node IP: ${CYAN}${CLOUD_NODE_IP}${NC}"
    echo -e "  Client:        ${CYAN}http://${CLOUD_NODE_IP}:30080${NC}"
    echo -e "  Server:        ${CYAN}http://${CLOUD_NODE_IP}:30300${NC}"
    echo -e "  LiveKit:       ${CYAN}http://${CLOUD_NODE_IP}:30880${NC}"
    echo -e "  MinIO Console: ${CYAN}http://${CLOUD_NODE_IP}:30001${NC}"
    echo -e "  Coturn (TURN): ${CYAN}turn:${CLOUD_NODE_IP}:3478${NC}"
    echo ""

    echo -e "${YELLOW}To get node IPs:${NC}"
    echo -e "  ${CYAN}kubectl get nodes -o wide${NC}"
    echo ""

    echo -e "${YELLOW}To check logs:${NC}"
    echo -e "  ${CYAN}kubectl logs -f deployment/verse-server -n ${NAMESPACE}${NC}"
    echo -e "  ${CYAN}kubectl logs -f deployment/verse-client -n ${NAMESPACE}${NC}"
    echo -e "  ${CYAN}kubectl logs -f deployment/verse-captions -n ${NAMESPACE}${NC}"
    echo ""

    echo -e "${YELLOW}To check pod status:${NC}"
    echo -e "  ${CYAN}kubectl get pods -n ${NAMESPACE} -w${NC}"
    echo ""

    echo -e "${BLUE}Edge Node Setup:${NC}"
    get_edge_token

    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Summary:${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ KubeEdge CloudCore is running${NC}"
    echo -e "${GREEN}✓ Coturn TURN server deployed${NC}"
    echo -e "${GREEN}✓ Infrastructure services deployed${NC}"

    # Check for image pull errors
    if kubectl get pods -n ${NAMESPACE} 2>/dev/null | grep -q "ImagePullBackOff\|ErrImagePull"; then
        echo -e "${YELLOW}⚠ Some application pods have image pull errors${NC}"
        echo -e "${YELLOW}  This is expected if you haven't built/pushed the images yet${NC}"
        echo -e "${YELLOW}  Build and push your images, then they will auto-deploy${NC}"
    fi

    echo ""
    echo -e "${CYAN}Next steps:${NC}"
    echo -e "  1. Build and push your application images"
    echo -e "  2. Set up edge nodes using the token above"
    echo -e "  3. Access services at the URLs listed above"
}

# Run main function
main
