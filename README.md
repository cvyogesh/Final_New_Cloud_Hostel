Hostel Allocation System
This project is a complete web application for managing hostel room allocations for a university. It is now configured to run on Docker and Kubernetes.

Features
Student & Admin Portals

AI Helpdesk powered by Google Gemini

Containerized with Docker

Orchestrated by Kubernetes

How to Run with Docker & Kubernetes
Step 1: Build the Docker Image
First, build the Docker image from the Dockerfile.

docker build -t hostel-allocation-app .

Step 2: Deploy to Kubernetes
Prerequisites:

Docker Desktop installed with Kubernetes enabled.

Instructions:

Load Environment Variables:
Your database credentials and API keys from .env need to be loaded into Kubernetes as a "ConfigMap". This is a secure way to handle configuration. Run this command once:

kubectl create configmap hostel-env --from-env-file=.env

(If you need to update your variables, delete the old one first with kubectl delete configmap hostel-env)

Apply the Configurations:
Use kubectl to apply the deployment and service configurations. This tells Kubernetes to start your application.

kubectl apply -f deployment.yaml
kubectl apply -f service.yaml

Verify the Deployment:
Check that everything is running.

kubectl get pods
kubectl get services

You should see two pods running. In the service list, look for hostel-app-service and note the port mapping (e.g., 8000:31234/TCP). The second number is your NodePort.

Access the Application:
Your application is no longer running on localhost:8000. It is now accessible at http://localhost:<NodePort>, where <NodePort> is the port you found in the previous step. You will need to update your utils.js file with this new port to connect your frontend.

Step 3: Cleaning Up
To stop the application and remove all Kubernetes components, run:

kubectl delete -f deployment.yaml
kubectl delete -f service.yaml
kubectl delete configmap hostel-env
