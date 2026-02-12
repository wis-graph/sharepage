---
created: 2026-02-13
source_type: YouTube
url: (https://www.youtube.com/watch?v=sA0mSkONrxE)
description: 현재 파편화된 AI 에이전트 생태계를 통합하기 위해, 구현 방식과 무관하게 상호 통신할 수 있는 개방형 표준인 **[[A2A Protocol]]**이 등장했다.
channel: Google Cloud Tech
author: Holt Skinner
status: 🌲 Permanent Note
tags:
* "#Knowledge_Management"
* "#AI_Agents"
* "#A2A_Protocol"
* "#Interoperability"
* "#Google_Cloud"
---

# 📑 Google A2A 프로토콜: 멀티 에이전트 협업의 표준

![](https://www.youtube.com/watch?v=sA0mSkONrxE)

> [!ABSTRACT] 3줄 요약
> 1. 현재 파편화된 AI 에이전트 생태계를 통합하기 위해, 구현 방식과 무관하게 상호 통신할 수 있는 개방형 표준인 **[[A2A Protocol]]**이 등장했다.
> 2. 에이전트는 '에이전트 카드(Agent Card)'를 통해 서로를 식별하며, **[[JSON-RPC]]**와 **HTTPS**를 통해 보안 통신을 수행한다.
> 3. A2A는 기존의 **[[MCP]](Model Context Protocol)**와 경쟁하지 않고, 에이전트 간 협업(A2A)과 도구 사용(MCP)이라는 상호 보완적인 관계를 형성한다.

## 목차

* [[#파편화된 에이전트 생태계와 A2A의 등장]]
* [[#A2A의 핵심 메커니즘: 발견과 통신]]
* [[#비동기 작업 처리: 폴링과 스트리밍]]
* [[#A2A와 MCP의 관계: 경쟁이 아닌 보완]]
* [[#결론 및 액션 아이템]]

---

## 파편화된 에이전트 생태계와 A2A의 등장

> *서로 다른 프레임워크로 만들어진 에이전트들이 소통할 수 없는 '바벨탑' 문제를 해결하기 위한 표준 프로토콜의 필요성.*

* **문제점 (Silos of Agents)**: 현재 수많은 회사들이 여행, 호텔, 액티비티 예약 등 다양한 에이전트를 만들고 있지만, 서로 다른 프레임워크를 사용하기 때문에 협업이 불가능하다.
* 남이 만든 에이전트를 쓰고 싶어도 내부 작동 방식을 알 수 없는 '불투명한 블랙박스(Opaque)' 상태다.


* **해결책: [[A2A Protocol]] (Agent-to-Agent)**:
* **정의**: 에이전트의 구현 방식(LangChain, Semantic Kernel 등)과 상관없이 AI 에이전트 간의 통신과 협업을 가능하게 하는 개방형 표준이다.
* **유추 (Analogy)**:
> [!QUOTE] 레고 블록 (Lego Blocks)
> "모든 A2A 에이전트는 표준화된 정보를 전송하고 공용 메서드를 지원하므로, 마치 레고 블록처럼 어떤 에이전트와도 결합될 수 있습니다."


* *해설*: [[LangChain]]이 모델(LLM) 간의 교체를 쉽게 만들었다면, A2A는 에이전트 간의 소통을 표준화한다.





## A2A의 핵심 메커니즘: 발견과 통신

### 역할의 유동성 (Client & Remote)

* **Client Agent**: 요청을 생성하고 최종 사용자와 상호작용하는 주체.
* **Remote Agent**: 요청에 따라 정보를 제공하거나 행동을 취하는 주체.
* *특징*: 고정된 역할이 아니며, 상황에 따라 누구나 클라이언트가 되거나 원격 에이전트가 될 수 있다.

### 1. 에이전트 발견 (Discovery): [[Agent Card]]

* 에이전트 A가 에이전트 B를 찾고 기능을 파악하는 방법.
* **Agent Card**: 에이전트 도메인의 잘 알려진 URI에 위치한 표준 [[JSON]] 파일.
* **기능**: '디지털 명함' 역할을 하며, 웹 크롤러를 위한 `robots.txt`나 마이크로서비스의 '서비스 레지스트리'와 유사하다.
* **포함 정보**: 에이전트 이름, ID, HTTPS 엔드포인트 URL, 특정 기술(Skill), 인증 방법 등.



### 2. 보안 통신 (Communication): [[JSON-RPC]]

* 통신 규격: 표준 **HTTPS** 위에서 **[[JSON-RPC]] 2.0** 포맷을 사용한다.
* *용어 설명*: **JSON-RPC**란 원격 서버의 함수를 호출하기 위한 가벼운 데이터 교환 프로토콜이다.


* **메시지 구조**:
* 역할(Role): 사용자(User) 또는 에이전트(Agent).
* 파트(Parts): 실제 콘텐츠 (텍스트, 파일, 멀티모달 데이터 등).


* **Agent Executor**: SDK 내부에 존재하는 클래스로, A2A 프로토콜의 배관 작업(Plumbing)과 에이전트의 고유 로직을 연결하는 브리지 역할을 한다.

## 비동기 작업 처리: 폴링과 스트리밍

> *오래 걸리는 작업(Long-running process)을 처리할 때 사용자를 기다리게 하지 않는 두 가지 전략.*

* **전략 1: 폴링 (Polling)**
* **Task 객체**: 작업을 요청하면 즉시 결과 대신 'Task ID'와 '상태(제출됨, 작업 중 등)'를 반환한다.
* **프로세스**: 클라이언트는 `tasks.get(task_id)` 메서드를 주기적으로 호출하여 완료 여부를 확인한다.
* *단점*: 실시간성이 떨어지고 비효율적일 수 있다.


* **전략 2: 스트리밍 (Streaming) - 권장**
* **기술**: **[[SSE]] (Server-Sent Events)** 방식을 지원한다.
* **프로세스**: HTTPS 연결을 열어두고, 업데이트가 발생할 때마다 서버(Remote Agent)가 클라이언트에게 데이터를 푸시(Push)한다.
* **장점**:
* '작업 중', '완료' 등의 상태 변화를 즉시 알 수 있다.
* 긴 텍스트 생성 시 청크(Chunk) 단위로 전송하여 사용자 경험(UX)을 획기적으로 개선한다.





## A2A와 MCP의 관계: 경쟁이 아닌 보완

### [[MCP]] (Model Context Protocol)와의 비교

* **오해**: A2A가 MCP를 대체하거나 경쟁하는가? -> **NO.**
* **상호 보완적 관계**:
1. **[[MCP]]**: 에이전트가 **도구(Tool)**, API, 리소스와 연결되는 표준. (Agent ↔ Tool)
2. **[[A2A Protocol]]**: 에이전트가 **동료 에이전트(Peer)**와 연결되는 표준. (Agent ↔ Agent)


* **통합 스택**: 정교한 시스템에서는 에이전트 간 대화에는 A2A를 사용하고, 각 에이전트가 개별 작업을 수행할 때는 MCP를 사용하는 구조가 될 것이다.

## 결론 및 액션 아이템

> *구글이 권장하는 이 스택은 폐쇄적인 생태계를 넘어, 누구나 참여 가능한 '에이전틱 웹(Agentic Web)'을 지향한다.*

* **핵심 시사점**: AI 에이전트 개발의 미래는 단일 슈퍼 에이전트가 아니라, 전문화된 에이전트들이 표준 프로토콜(A2A)을 통해 레고처럼 조립되는 **멀티 에이전트 시스템**이다.
* **Action Items**:
* [ ] `pip install a2a-sdk`로 Python SDK 설치해보기.
* [ ] GitHub의 `google/a2a` 리포지토리에서 샘플 코드(여행 예약 시나리오 등) 분석하기.
* [ ] (Thinking): 현재 개발 중인 봇이나 에이전트에 [[Agent Card]]를 적용하여 외부 연결성을 확보할 수 있을지 검토할 것.



---

### 🔗 참고 자료

* 관련 노트: [[AI Agent Architecture]], [[Microservices Design]], [[Interoperability Standards]]
* 언급된 도구/리소스: [[Google Cloud AI]], [[LangChain]], [[MCP]], [[JSON-RPC]]
