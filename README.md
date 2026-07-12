# Automated Multi-Environment Deployment Pipeline

Đây là project DevOps thực hành mô phỏng quy trình CI/CD tự động cho một ứng dụng Node.js qua nhiều môi trường: local development, staging và production.

Project sử dụng GitHub Actions, Docker, GitHub Container Registry, self-hosted runner và các máy ảo Ubuntu local để mô phỏng một pipeline triển khai gần giống thực tế mà không cần dùng VPS trả phí.

## Mục tiêu project

Project này được xây dựng để thực hành các kỹ năng DevOps cốt lõi:

- Xây dựng ứng dụng backend đơn giản có test tự động
- Containerize ứng dụng bằng Docker
- Thiết lập CI bằng GitHub Actions
- Publish Docker image lên container registry
- Deploy tự động lên staging
- Promote code từ staging lên production qua Pull Request
- Bảo vệ production bằng manual approval
- Deploy production qua self-hosted runner và SSH
- Tách rõ cấu hình runtime giữa staging và production

## Công nghệ sử dụng

- Node.js
- Express
- Jest
- Supertest
- Docker
- Docker Compose
- GitHub Actions
- GitHub Container Registry
- Ubuntu Server VM
- GitHub Actions self-hosted runner
- SSH-based deployment

## Ứng dụng

Ứng dụng cung cấp hai endpoint chính:

```text
GET /
GET /health
```

Ví dụ response từ endpoint `/`:

```json
{
  "message": "Automated Multi-Environment Deployment Pipeline",
  "environment": "production"
}
```

Ví dụ response từ endpoint `/health`:

```json
{
  "status": "ok"
}
```

Giá trị `environment` được lấy từ biến môi trường `NODE_ENV`.

Nếu chạy local mà không set `NODE_ENV`, ứng dụng mặc định trả về:

```text
development
```

## Các môi trường triển khai

| Môi trường | Branch             | Docker image tag | Nơi chạy             | NODE_ENV    |
| Local      | local working tree | local image      | Developer machine    | development |
| Staging    | develop            | `develop`        | Ubuntu staging VM    | staging     |
| Production | main               | `main`           | Ubuntu production VM | production  |

## Tổng quan pipeline

```text
Developer push code lên develop
        |
        v
GitHub Actions chạy CI
        |
        v
Build và publish Docker image với tag :develop
        |
        v
Self-hosted runner SSH vào staging VM
        |
        v
Deploy staging
        |
        v
Tạo Pull Request từ develop vào main
        |
        v
CI chạy lại trên Pull Request / main
        |
        v
Merge vào main
        |
        v
Build và publish Docker image với tag :main
        |
        v
Chờ manual approval cho production environment
        |
        v
Self-hosted runner SSH vào production VM
        |
        v
Deploy production
```

## Kiến trúc tổng thể

```text
GitHub Repository
  |
  | push / pull request
  v
GitHub Actions
  |
  | CI: npm ci, npm test, docker build
  |
  | Publish Docker image
  v
GitHub Container Registry
  |
  | <container-registry>/<image-name>:develop
  | <container-registry>/<image-name>:main
  v
Self-hosted GitHub Actions Runner
  |
  | SSH
  v
Ubuntu VM - Staging
Ubuntu VM - Production
```

## Chiến lược branch

Project sử dụng hai branch chính:

```text
develop
main
```

Branch `develop` đại diện cho môi trường staging.

Branch `main` đại diện cho môi trường production.

Quy trình promote code:

```text
develop -> Pull Request -> main
```

Cách làm này giúp production không nhận thay đổi trực tiếp từ quá trình development. Mọi thay đổi muốn lên production đều phải đi qua Pull Request và GitHub Actions.

## CI workflow

CI workflow chạy khi có push hoặc Pull Request vào `develop` và `main`.

Các bước chính:

```text
npm ci
npm test
docker build
```

Mục tiêu của CI là đảm bảo:

- Dependency cài được bằng `npm ci`
- Test tự động pass
- Docker image build được
- Code đủ điều kiện để deploy

## Publish Docker image

Docker image được publish lên GitHub Container Registry.

Image cho staging dùng tag:

```text
develop
```

Image cho production dùng tag:

```text
main
```

Khi push lên `develop`, GitHub Actions build image và push tag `develop`.

Khi merge vào `main`, GitHub Actions build image và push tag `main`.

## Deployment

Deployment được thực hiện thông qua self-hosted GitHub Actions runner.

Lý do cần self-hosted runner là vì staging VM và production VM nằm trong mạng local. GitHub-hosted runner trên cloud không thể truy cập trực tiếp vào các VM local này.

Self-hosted runner nằm cùng mạng với VM nên có thể SSH vào staging và production VM.

Luồng deploy:

```text
GitHub Actions -> self-hosted runner -> SSH vào Ubuntu VM -> Docker deploy
```

Các lệnh deploy chính trên VM:

```text
docker pull
docker stop
docker rm
docker run
curl /health
```

Container staging:

```text
Tên container: staging-app
Image tag: develop
NODE_ENV=staging
```

Container production:

```text
Tên container: production-app
Image tag: main
NODE_ENV=production
```

## Production approval

Production deployment sử dụng GitHub Environment tên là:

```text
production
```

Environment này được cấu hình required reviewer/manual approval.

Điều này có nghĩa là sau khi code được merge vào `main`, workflow production không deploy ngay lập tức. GitHub sẽ dừng ở bước chờ approval. Chỉ sau khi người có quyền bấm approve, job deploy production mới được chạy.

Mục đích:

- Tránh deploy production ngoài ý muốn
- Mô phỏng quy trình release thực tế
- Tách staging deployment và production deployment rõ ràng

## Chạy local

Cài dependencies:

```bash
npm install
```

Chạy test:

```bash
npm test
```

Chạy app local:

```bash
npm start
```

Ứng dụng chạy tại:

```text
http://localhost:3000
```

Kiểm tra:

```bash
curl http://localhost:3000/
curl http://localhost:3000/health
```

## Chạy bằng Docker local

Build Docker image:

```bash
docker build -t automated-multi-env-deployment .
```

Run container:

```bash
docker run -d --name local-app -p 3000:3000 automated-multi-env-deployment
```

Kiểm tra:

```bash
curl http://localhost:3000/
curl http://localhost:3000/health
```

Dừng và xóa container:

```bash
docker stop local-app
docker rm local-app
```

## Chạy bằng Docker Compose

Start app:

```bash
docker compose up -d --build
```

Xem logs:

```bash
docker compose logs app
```

Dừng app:

```bash
docker compose down
```

## Demo staging

Staging VM được truy cập bằng địa chỉ IP nội bộ của môi trường lab.

Kiểm tra staging:

```bash
curl http://<staging-vm-ip>:3000/
curl http://<staging-vm-ip>:3000/health
```

Kết quả mong đợi:

```json
{
  "message": "Automated Multi-Environment Deployment Pipeline",
  "environment": "staging"
}
```

Health check:

```json
{
  "status": "ok"
}
```

## Demo production

Production VM được truy cập bằng địa chỉ IP nội bộ của môi trường lab.

Kiểm tra production:

```bash
curl http://<production-vm-ip>:3000/
curl http://<production-vm-ip>:3000/health
```

Kết quả mong đợi:

```json
{
  "message": "Automated Multi-Environment Deployment Pipeline",
  "environment": "production"
}
```

Health check:

```json
{
  "status": "ok"
}
```

## Các workflow chính

Project có các GitHub Actions workflow sau:

```text
.github/workflows/ci.yml
.github/workflows/publish-image.yml
.github/workflows/deploy-staging.yml
.github/workflows/deploy-production.yml
```

`ci.yml` chịu trách nhiệm test và kiểm tra Docker build.

`publish-image.yml` chịu trách nhiệm build và push Docker image lên container registry.

`deploy-staging.yml` chịu trách nhiệm deploy tự động lên staging khi có push vào `develop`.

`deploy-production.yml` chịu trách nhiệm deploy production khi có thay đổi trên `main`, sau khi production environment được approve.

## Secrets và environment

Project sử dụng GitHub Secrets để lưu thông tin nhạy cảm như SSH private key, host và user deploy.

Không commit private key, token, password, IP nội bộ hoặc thông tin cá nhân vào repository.

Ví dụ nhóm secret thường dùng:

```text
STAGING_SSH_KEY_B64
STAGING_HOST
STAGING_USER
PRODUCTION_SSH_KEY_B64
PRODUCTION_HOST
PRODUCTION_USER
```

SSH key có thể được lưu ở dạng base64 để tránh lỗi format khi GitHub Actions ghi private key ra file tạm trên runner.

## Vì sao không dùng GitHub-hosted runner cho deploy?

GitHub-hosted runner chạy trên hạ tầng cloud của GitHub.

Trong project này, staging và production VM nằm trong mạng local của homelab. Các runner cloud không thể truy cập trực tiếp vào IP nội bộ của VM.

Vì vậy project dùng self-hosted runner chạy trong cùng mạng với VM. Runner này có thể SSH vào staging và production để thực hiện deploy.

## Những kỹ năng DevOps project này thể hiện

- Thiết kế CI/CD pipeline nhiều môi trường
- Viết test tự động cho Node.js app
- Containerize ứng dụng bằng Docker
- Sử dụng Docker Compose cho local workflow
- Build và publish Docker image lên container registry
- Dùng GitHub Actions cho CI
- Dùng GitHub Actions cho CD
- Cấu hình self-hosted runner
- Deploy qua SSH
- Tách staging và production
- Dùng Pull Request để promote code
- Bảo vệ production bằng manual approval
- Quản lý secrets an toàn
- Debug lỗi network, SSH, Docker và GitHub Actions

## Ghi chú

Project này dùng local Ubuntu VM thay vì VPS/cloud server để tiết kiệm chi phí và phù hợp với môi trường homelab.

Trong môi trường thực tế, staging và production thường có thể là cloud VM, Kubernetes cluster, ECS, Azure App Service hoặc một nền tảng hosting tương đương. Tuy nhiên, kiến trúc CI/CD trong project này vẫn mô phỏng đúng các thành phần quan trọng của một pipeline triển khai thực tế.