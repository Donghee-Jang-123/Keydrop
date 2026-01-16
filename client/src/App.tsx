import { useState, useEffect } from 'react';
import './App.css';

function App() {
  // 서버에서 받은 메시지를 담을 변수
  const [serverMessage, setServerMessage] = useState<string>("연결 대기 중...");

  useEffect(() => {
    // 1. 스프링 부트(/api/test)로 데이터를 달라고 요청
    fetch('/api/test')
      .then((response) => {
        if (response.ok) {
          return response.text(); // 2. 텍스트로 변환
        }
        throw new Error("서버 응답 실패");
      })
      .then((data) => {
        // 3. 받아온 데이터를 화면 변수에 저장
        setServerMessage(data); 
        console.log("서버로부터 받은 데이터:", data);
      })
      .catch((error) => {
        console.error("에러 발생:", error);
        setServerMessage("서버 연결 실패 😭 (콘솔 확인 필요)");
      });
  }, []); // 빈 배열 [] : 화면이 처음 뜰 때 딱 한 번만 실행

  return (
    <div className="App">
      <h1>Keydrop 통신 테스트</h1>
      <div className="card">
        <h2>서버 응답 결과:</h2>
        {/* 4. 여기에 서버가 보낸 말이 뜹니다 */}
        <p style={{ color: 'blue', fontSize: '20px', fontWeight: 'bold' }}>
          {serverMessage}
        </p>
      </div>
    </div>
  );
}

export default App;