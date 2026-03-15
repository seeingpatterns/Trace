# Vite + 파일 분리 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** index.html 1105줄을 Vite 기반 멀티파일 구조로 분리하되, 동작을 100% 유지한다.

**Architecture:** CDN 스크립트를 npm 패키지로 전환하고, CSS/JS를 기능별 파일로 분리한다. Vite가 ES module 번들링과 dev server를 담당한다.

**Tech Stack:** Vite, Three.js r128 (npm), GSAP (npm), 바닐라 JS

---

### Task 1: Vite 프로젝트 초기화

**Files:**
- Create: `package.json`
- Create: `vite.config.js`

**Step 1: package.json 생성**

```json
{
  "name": "cinegraph",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

**Step 2: npm install**

```bash
cd /Users/jungeunkim/Desktop/Trace
npm install vite three@0.128.0 gsap --save-dev
```

Three.js 0.128.0은 현재 CDN 버전과 동일.

**Step 3: vite.config.js 생성**

```js
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
  },
});
```

**Step 4: public 폴더에 데이터 파일 이동**

```bash
mkdir -p public
cp films_embedded.json public/
```

Vite의 `public/` 폴더 파일은 빌드 시 그대로 `dist/`에 복사됨. fetch('/films_embedded.json')이 동작함.

**Step 5: .gitignore 업데이트**

`node_modules/`와 `dist/` 추가.

**Step 6: 동작 확인**

```bash
npx vite --open
```

이 시점에서는 아직 기존 index.html이 그대로 실행됨 (CDN 스크립트 포함).

**Step 7: Commit**

```bash
git add package.json vite.config.js public/ .gitignore
git commit -m "chore: initialize Vite project with Three.js and GSAP"
```

---

### Task 2: CSS 분리

**Files:**
- Create: `style.css`
- Modify: `index.html` (style 블록 제거)

**Step 1: style.css 생성**

index.html의 `<style>` 블록(40-315줄) 내용을 그대로 `style.css`로 이동.

**Step 2: index.html에서 style 블록 제거하고 link 태그 추가**

```html
<link rel="stylesheet" href="/style.css">
```

**Step 3: 브라우저에서 동작 확인**

`npx vite` → 스타일이 동일한지 눈으로 확인.

**Step 4: Commit**

```bash
git add style.css index.html
git commit -m "refactor: extract CSS to style.css"
```

---

### Task 3: src/data.js — 데이터 모듈 분리

**Files:**
- Create: `src/data.js`

**Step 1: src/data.js 생성**

index.html에서 다음을 추출:
- `COLORS` 배열 (361-369줄)
- `COLORS_HEX` 배열 (371줄)
- `CLUSTER_NAMES` 배열 (373줄)
- `generateDemoData()` 함수 (679-764줄)
- `loadFilms()` 함수 (fetch + 폴백)

```js
import * as THREE from 'three';

export const COLORS = [
  new THREE.Color('#1EE3CF'),
  new THREE.Color('#6B48FF'),
  new THREE.Color('#125D98'),
  new THREE.Color('#CFD6DE'),
  new THREE.Color('#FF6B6B'),
  new THREE.Color('#C084FC'),
  new THREE.Color('#34D399'),
];

export const COLORS_HEX = ['#1EE3CF','#6B48FF','#125D98','#CFD6DE','#FF6B6B','#C084FC','#34D399'];

export const CLUSTER_NAMES = ['클러스터 A','클러스터 B','클러스터 C','클러스터 D','클러스터 E','클러스터 F','클러스터 G'];

function generateDemoData() {
  // ... 기존 코드 그대로
}

export async function loadFilms() {
  try {
    const resp = await fetch('/films_embedded.json');
    return await resp.json();
  } catch {
    return generateDemoData();
  }
}
```

**Step 2: Commit**

```bash
git add src/data.js
git commit -m "refactor: extract data module (colors, films loader)"
```

---

### Task 4: src/scene.js — Three.js 씬 모듈 분리

**Files:**
- Create: `src/scene.js`

**Step 1: src/scene.js 생성**

index.html에서 다음을 추출:
- pixelRatio (358줄)
- Scene, Camera, Renderer, Bloom 설정 (376-396줄)
- EffectComposer 설정 (393-396줄)
- Group (398-400줄)
- createDotTexture() (402-416줄)
- Sparkle 클래스 + sparkle 시스템 (420-467줄)
- Star 클래스 + 은하 배경 (469-509줄)
- buildConstellation() (562-674줄)
- render() 루프 (1048-1099줄)

Three.js r128 npm에서는 postprocessing을 이렇게 import:
```js
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
```

export 대상:
- `scene, camera, renderer, composer, group`
- `filmNodePoints, filmPositions3D, sparkles`
- `Sparkle` 클래스
- `buildConstellation(films, ...)`
- `startRender()`
- `handleResize()`

**Step 2: Commit**

```bash
git add src/scene.js
git commit -m "refactor: extract Three.js scene module"
```

---

### Task 5: src/ui.js — UI 모듈 분리

**Files:**
- Create: `src/ui.js`

**Step 1: src/ui.js 생성**

index.html에서 다음을 추출:
- buildLegend() (769-789줄)
- bindEvents() (799-877줄)
- onMouseMove() (879-927줄)
- updateCard(), positionCard() (932-964줄)
- findMyStars(), resetStars(), updateNodeVisuals() (969-1041줄)
- 검색/find-input 이벤트 (1038-1041줄)

scene.js에서 필요한 것들을 import:
```js
import { camera, group, composer, renderer, filmNodePoints, ... } from './scene.js';
```

data.js에서:
```js
import { COLORS, COLORS_HEX } from './data.js';
```

**Step 2: Commit**

```bash
git add src/ui.js
git commit -m "refactor: extract UI module (legend, events, card, search)"
```

---

### Task 6: src/main.js — 진입점 조립

**Files:**
- Create: `src/main.js`

**Step 1: src/main.js 생성**

```js
import '../style.css';
import { loadFilms, COLORS } from './data.js';
import { buildConstellation, startRender, ... } from './scene.js';
import { buildLegend, bindEvents, ... } from './ui.js';

async function init() {
  const films = await loadFilms();

  // URL 파라미터 보물찾기
  const urlParams = new URLSearchParams(window.location.search);
  const highlightUser = urlParams.get('user')?.toLowerCase() || '';
  // ... 보물찾기 로직

  buildConstellation(films, highlightUser, userFilmIndices);
  buildLegend(films);
  bindEvents(films);

  document.getElementById('loading').classList.add('hidden');
  startRender();
}

init();
```

**Step 2: Commit**

```bash
git add src/main.js
git commit -m "refactor: create main.js entry point"
```

---

### Task 7: index.html 정리

**Files:**
- Modify: `index.html`

**Step 1: index.html 정리**

- CDN 스크립트 태그 6개 제거 (three.js, gsap 관련)
- `<style>` 블록 제거 (이미 Task 2에서 완료)
- `<script>` 블록 전체 제거 (353-1103줄)
- `<script type="module" src="/src/main.js"></script>` 추가
- 셰이더 `<script>` 태그 2개는 유지 (vertexshader, fragmentshader)

최종 index.html: ~60줄

**Step 2: 동작 확인**

```bash
npx vite
```

브라우저에서 확인할 것:
1. 성좌도 렌더링
2. 마우스 드래그로 회전
3. 영화 호버 시 카드 표시
4. 클러스터 범례 클릭
5. 검색 기능
6. 내 별 찾기 기능
7. URL ?user=xxx 보물찾기
8. 모바일 반응형 (개발자도구 모바일 모드)

**Step 3: Commit**

```bash
git add index.html
git commit -m "refactor: clean index.html, all code moved to modules"
```

---

### Task 8: 빌드 & 배포 확인

**Files:**
- Modify: `.gitignore`

**Step 1: 프로덕션 빌드**

```bash
npm run build
```

`dist/` 폴더가 생성되고, `dist/index.html` + 번들된 JS/CSS가 있어야 함.

**Step 2: 프리뷰**

```bash
npm run preview
```

빌드된 결과물이 정상 동작하는지 확인.

**Step 3: .gitignore 최종 확인**

```
node_modules/
dist/
```

**Step 4: Vercel 설정 확인**

Vercel 대시보드에서:
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

**Step 5: 기존 루트의 films_embedded.json 정리**

루트에 있던 `films_embedded.json`은 `public/`으로 이동했으므로 루트 파일 삭제.

**Step 6: 최종 Commit**

```bash
git add -A
git commit -m "chore: finalize Vite build setup and cleanup"
```

---

## 실행 순서 요약

| Task | 내용 | 의존성 |
|------|------|--------|
| 1 | Vite 초기화 | 없음 |
| 2 | CSS 분리 | Task 1 |
| 3 | data.js | Task 1 |
| 4 | scene.js | Task 3 |
| 5 | ui.js | Task 3, 4 |
| 6 | main.js | Task 3, 4, 5 |
| 7 | index.html 정리 | Task 2, 6 |
| 8 | 빌드 & 배포 | Task 7 |

Task 3, 4는 독립적이라 병렬 가능.
