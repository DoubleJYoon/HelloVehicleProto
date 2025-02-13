document.addEventListener("DOMContentLoaded", function () {
    // 기존 초기화 코드들 실행
    initializeVehicles(); // 차량 데이터 초기화
    updateDashboard(); // 대시보드 초기 업데이트

    updateSectionValues(); // ✅ 페이지 로드 후 즉시 실행 (초기화된 데이터 반영)
    setInterval(updateSectionValues, 100); // ✅ 10초마다 실행 (업데이트 유지)
});

document.addEventListener("DOMContentLoaded", function () {
    function updateDateTime() {
        const dateTimeElement = document.getElementById("current-datetime");
        if (!dateTimeElement) return; // 요소가 없으면 실행하지 않음
        
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");

        // yyyy/MM/dd HH:mm:ss 형식으로 날짜 및 시간 표시
        const formattedDateTime = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;

        // HTML 요소 업데이트
        dateTimeElement.innerText = formattedDateTime;
    }

    // 페이지 로드 시 즉시 실행 및 매초마다 업데이트
    updateDateTime();
    setInterval(updateDateTime, 1000);
});


document.addEventListener('DOMContentLoaded', function () {

    const languageSelector = document.getElementById("language-selector");

    // 🔹 언어 선택 버튼 클릭 이벤트 추가 (KO ↔ ENG 전환)
    languageSelector.addEventListener("click", function () {
        if (languageSelector.textContent.trim() === "KO") {
            languageSelector.textContent = "ENG";
        } else {
            languageSelector.textContent = "KO";
        }
        languageSelector.classList.toggle("active"); // 시각적인 변화 (필요하면 사용)
    });
    
    const mapContainer = document.getElementById('map');
    const mapOption = {
        center: new kakao.maps.LatLng(37.5665, 126.9780),
        level: 7
    }; 
    const map = new kakao.maps.Map(mapContainer, mapOption);
    
    const toggleButton = document.getElementById('toggle-button');
    const D = document.getElementById('side-dashboard');
    const closeDashboardBtn = document.getElementById('close-dashboard');
    const logOutBtn = document.getElementById('log-out-btn'); // LOG-OUT 버튼 선택

    toggleButton.addEventListener('click', () => {
        if (sideDashboard.classList.contains('open')) {
            sideDashboard.classList.remove('open');
        } else {
            sideDashboard.classList.add('open');
        }
    });           
    
    // LOG-OUT 버튼 클릭 시 로그인 페이지로 이동
    logOutBtn.addEventListener('click', () => {
        window.location.href = 'index.html'; // index.html로 이동
    });

    // 메뉴 드롭다운 토글 기능 추가
    const menuHeaders = document.querySelectorAll('.menu-header');

    menuHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const subMenu = header.nextElementSibling;

            if (subMenu && subMenu.classList.contains('sub-menu')) {
                const isOpen = subMenu.style.display === 'block';
                subMenu.style.display = isOpen ? 'none' : 'block'; // 토글
                header.classList.toggle('active'); // 아이콘 회전
            }
        });
    });

    const imageSrc = 'car.png';
    const imageSize = new kakao.maps.Size(40, 40);
    const markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize);

    const regions = [
        { name: 'Seoul', lat: 37.4484, lng: 127.0588 },
        { name: 'hwasung', lat: 37.1994, lng: 126.8311 },
        { name: 'Jeju', lat: 33.4996, lng: 126.5312 },
        { name: 'Ulsan', lat: 35.5384, lng: 129.3114 }
    ];

    const roadSpeeds = {
        general: 60, // 일반도로 (km/h)
        national: 80, // 국도 (km/h)
        highway: 100 // 고속도로 (km/h)
    };    
    
    function calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // km 단위 거리 반환
    }

    async function fetchRoadPath(startLat, startLng, endLat, endLng) {
        const url = `https://apis-navi.kakaomobility.com/v1/route?origin=${startLng},${startLat}&destination=${endLng},${endLat}&priority=RECOMMEND`;
        const headers = {
            Authorization: "KakaoAK 3ee7f1efcef64edd9dd238f6aea79835"
        };
    
        try {
            const response = await fetch(url, { headers });
            const data = await response.json();
    
            if (data.routes && data.routes.length > 0) {
                const roadPath = [];
                const sections = data.routes[0].sections;
    
                sections.forEach((section) => {
                    section.roads.forEach((road) => {
                        const vertexes = road.vertexes;
                        for (let i = 0; i < vertexes.length; i += 2) {
                            roadPath.push({ lat: vertexes[i], lng: vertexes[i + 1] });
                        }
                    });
                });
    
                return roadPath;
            } else {
                console.warn("No road path found.");
                return [];
            }
        } catch (error) {
            console.error("Error fetching road path:", error);
            return [];
        }
    }
    
    // 차량 생성 시 도로 위 경로 생성
    async function createVehicle(id, region) {
        let roadPath = [];
        do {
            const destinationLat = region.lat + Math.random() * 0.05 - 0.025;
            const destinationLng = region.lng + Math.random() * 0.05 - 0.025;
            roadPath = await fetchRoadPath(region.lat, region.lng, destinationLat, destinationLng);
        } while (roadPath.length === 0); // 수정: 비도로 경로 방지

        return {
            id,
            marker: new kakao.maps.Marker({
                position: new kakao.maps.LatLng(region.lat, region.lng),
                image: markerImage,
                map: map
            }),
            path: roadPath,
            index: 0
        };
    }

// 차량이 도로 끝에 도달하면 새로운 경로 생성
async function moveVehicles() {
    for (const vehicle of vehicles) {
        if (vehicle.index >= vehicle.path.length - 1) {
            const currentPos = vehicle.marker.getPosition();
            const newDestinationLat = currentPos.getLat() + Math.random() * 0.05 - 0.025;
            const newDestinationLng = currentPos.getLng() + Math.random() * 0.05 - 0.025;

            // ✅ 'await'을 사용하려면 moveVehicles()도 async로 변경해야 함
            vehicle.path = await fetchRoadPath(currentPos.getLat(), currentPos.getLng(), newDestinationLat, newDestinationLng);
            vehicle.index = 0;
        }

        const nextPos = vehicle.path[vehicle.index];
        if (!nextPos) continue;

        const nextLatLng = new kakao.maps.LatLng(nextPos.lat, nextPos.lng);

        animateVehicleMove(vehicle, nextLatLng, () => {
            vehicle.index++;
            vehicle.status = ['Drive', 'Stop', 'Ready'][Math.floor(Math.random() * 3)];
            vehicle.safety = ['Best', 'Good', 'Caution'][Math.floor(Math.random() * 3)];
            vehicle.device = ['On', 'Check', 'Off'][Math.floor(Math.random() * 3)];

            updateDashboard();  // ✅ 이동 후 대시보드 즉시 업데이트
        });
    }
}

// ✅ 기존 setInterval을 유지하여 차량 이동이 반복 실행되도록 함
setInterval(moveVehicles, 5000);


    async function initializeVehicles() {
        const vehicleCounts = {
            Seoul: 20,
            Gyeonggi: 15,
            Jeju: 5,
            Ulsan: 8,
        };

        vehicles = [
            ...(await Promise.all(
                Array.from({ length: vehicleCounts.Seoul }, (_, i) =>
                    createVehicle(i + 1, regions[0])
                )
            )),
            ...(await Promise.all(
                Array.from({ length: vehicleCounts.Gyeonggi }, (_, i) =>
                    createVehicle(i + 1 + vehicleCounts.Seoul, regions[1])
                )
            )),
            ...(await Promise.all(
                Array.from({ length: vehicleCounts.Jeju }, (_, i) =>
                    createVehicle(
                        i + 1 + vehicleCounts.Seoul + vehicleCounts.Gyeonggi,
                        regions[2]
                    )
                )
            )),
            ...(await Promise.all(
                Array.from({ length: vehicleCounts.Ulsan }, (_, i) =>
                    createVehicle(
                        i +
                        1 +
                        vehicleCounts.Seoul +
                        vehicleCounts.Gyeonggi +
                        vehicleCounts.Jeju,
                        regions[3]
                    )
                )
            )),
        ];
    }         

    function createVehicle(id, region) {
        // 도로 위의 경로를 생성
        function generateRoadPath(region) {
            const roadPath = [
                { lat: region.lat, lng: region.lng },
                { lat: region.lat + 0.005, lng: region.lng + 0.005 },
                { lat: region.lat - 0.005, lng: region.lng + 0.005 },
                { lat: region.lat + 0.005, lng: region.lng - 0.005 },
                { lat: region.lat - 0.005, lng: region.lng - 0.005 }
            ];
        
            return Array.from({ length: 5 }, () => ({
                lat: region.lat + Math.random() * 0.1 - 0.05, // 반경 0.02 (확대된 범위)
                lng: region.lng + Math.random() * 0.1 - 0.05,
                roadType: ['general', 'national', 'highway'][Math.floor(Math.random() * 3)]
            }));
        }
        
    
        return {
            id,
            marker: new kakao.maps.Marker({
                position: new kakao.maps.LatLng(region.lat, region.lng), // 지역 중심으로 초기 위치 고정
                image: markerImage,
                map: map
            }),
            
            path: generateRoadPath(region), // 도로 위 경로 생성
            status: ['Drive', 'Stop', 'Ready'][Math.floor(Math.random() * 3)],
            safety: ['Best', 'Good', 'Caution'][Math.floor(Math.random() * 3)],
            device: ['On', 'Check', 'Off'][Math.floor(Math.random() * 3)],
            index: 0
        };
    }

    let vehicles = initializeVehicles();

    function moveVehicles() {
        vehicles.forEach(vehicle => {
            if (vehicle.index >= vehicle.path.length - 1) {
                vehicle.index = 0; // 경로 순환
            }
    
            const currentPos = vehicle.marker.getPosition();
            const nextPos = vehicle.path[vehicle.index];
            const nextLatLng = new kakao.maps.LatLng(nextPos.lat, nextPos.lng);
    
            const distance = calculateDistance(
                currentPos.getLat(),
                currentPos.getLng(),
                nextPos.lat,
                nextPos.lng
            );          

            const speed = roadSpeeds[nextPos.roadType]; // 도로 유형에 따른 속도
            const travelTime = (distance / speed) * 3600; // 이동 시간 (초)
            const frames = travelTime * 60; // 60fps 기준 프레임 수
            let frame = 0;
    
            function animate() {
                frame++;
                const progress = frame / frames;
            
                const interpolatedLat =
                    currentPos.getLat() + (nextPos.lat - currentPos.getLat()) * progress;
                const interpolatedLng =
                    currentPos.getLng() + (nextPos.lng - currentPos.getLng()) * progress;
            
                const interpolatedPos = new kakao.maps.LatLng(interpolatedLat, interpolatedLng);
                vehicle.marker.setPosition(interpolatedPos);
            
                if (frame < frames) {
                    requestAnimationFrame(animate);
                } else {
                    vehicle.index++;
                    vehicle.vehicle = ['Drive', 'Stop', 'Ready'][Math.floor(Math.random() * 3)];
                    vehicle.safety = ['Best', 'Good', 'Caution'][Math.floor(Math.random() * 3)];
                    vehicle.device = ['on', 'check', 'off'][Math.floor(Math.random() * 3)];
            
                    updateDashboard(); // 매 이동 후 대시보드 업데이트
                }
            }           
    
            animate();
        });
    }
    function animateNumberChange(element, start, end, duration = 15000) {
        if (start === end) {
            element.innerText = end; // 값이 같으면 애니메이션 적용하지 않음
            return;
        }

        const frameRate = 10000; // 프레임 속도를 줄임 (초당 30 프레임)
        const totalFrames = (duration / 10000) * frameRate;
        let currentFrame = 0;

        const easeInOutQuad = (t) => {
            return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        };

        function updateNumber() {
            currentFrame++;
            const progress = easeInOutQuad(currentFrame / totalFrames);
            const newValue = Math.round(start + (end - start) * progress);
    
            element.innerText = newValue; // 화면 업데이트
    
            if (currentFrame < totalFrames) {
                setTimeout(updateNumber, 10000 / frameRate); // 프레임 속도 조절 (더 천천히 변함)
            } else {
                element.innerText = end; // 최종값 보정
            }
        }

        // 부드러운 투명도 및 크기 애니메이션 추가
        element.style.transition = 'opacity 1.5s ease-in-out, transform 1.5s ease-in-out';
        element.style.opacity = 0.5;
        setTimeout(() => {
            element.style.opacity = 1;
            element.style.transform = 'scale(1)';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 7000);
        }, 2000);

        updateNumber();
}

    function updateAllNumbers(driveCount, stopCount, readyCount) {
        animateNumberChange(
            document.getElementById("drive-count"),
            parseInt(document.getElementById("drive-count").innerText),
            driveCount
        );
    
        animateNumberChange(
            document.getElementById("stop-count"),
            parseInt(document.getElementById("stop-count").innerText),
            stopCount
        );
    
        animateNumberChange(
            document.getElementById("ready-count"),
            parseInt(document.getElementById("ready-count").innerText),
            readyCount
        );

        animateNumberChange(
            document.getElementById("safety-best"),
            parseInt(document.getElementById("safety-best").innerText),
            driveCount
        );
    
        animateNumberChange(
            document.getElementById("safety-good"),
            parseInt(document.getElementById("safety-good").innerText),
            stopCount
        );
    
        animateNumberChange(
            document.getElementById("safety-caution"),
            parseInt(document.getElementById("safety-caution").innerText),
            readyCount
        );        
    }      
        setInterval(() => {
            updateAllNumbers(
                Math.floor(Math.random() * 100), 
                Math.floor(Math.random() * 100), 
                Math.floor(Math.random() * 100),
                Math.floor(Math.random() * 100),
                Math.floor(Math.random() * 100),
                Math.floor(Math.random() * 100),
                Math.floor(Math.random() * 100),
                Math.floor(Math.random() * 100),
                Math.floor(Math.random() * 100),
            );
        }, 5000);
    
    function animateNumberChange(element, start, end, duration = 0.005) {
        const stepTime = 10; // 업데이트 간격 (밀리초)
        const steps = Math.floor(duration / stepTime); // 총 스텝 수
        const increment = (end - start) / steps; // 단계별 증가량
        let current = start; // 현재 값 초기화
        let step = 0;
    
        function stepAnimation() {
            current += increment; // 값 증가
            element.innerText = (Math.round(current * 10) / 10).toFixed(1); // 소수점 첫째 자리까지 표현
            step++;
    
            if (step < steps) {
                setTimeout(stepAnimation, stepTime); // 다음 스텝으로 진행
            } else {
                element.innerText = end.toFixed(1); // 마지막 값 보정
            }
        }
    
        stepAnimation(); // 애니메이션 시작
    }   

    setInterval(moveVehicles, 5000);

    function updateNumberSmoothly(element, newValue) {
        const currentValue = parseInt(element.innerText);
        if (currentValue !== newValue) {
            element.innerText = newValue;
        }
    }
    
    function animateValueChange(element, newValue) {
        const oldValue = parseInt(element.innerText) || 0;
        if (oldValue === newValue) return; // 값이 동일하면 애니메이션 실행 X
    
        // 기존 값이 위로 사라지는 애니메이션 적용
        element.style.transform = "translateY(-20px)";
        element.style.opacity = "0";
        
        setTimeout(() => {
            element.innerText = newValue; // 새로운 값 적용
            element.style.transform = "translateY(10px)"; // 새로운 값 아래에서 시작
            element.style.opacity = "0"; 
    
            setTimeout(() => {
                element.style.transform = "translateY(0)"; // 원래 위치로 복귀
                element.style.opacity = "1";
            }, 500);
        }, 500); // 기존 값이 사라지는 애니메이션 시간과 맞춤
    }

    function updateDashboard() {
        const driveCount = vehicles.filter(v => v.status === 'Drive').length;
        const stopCount = vehicles.filter(v => v.status === 'Stop').length;
        const readyCount = vehicles.filter(v => v.status === 'Ready').length;
    
        const safetyBest = vehicles.filter(v => v.safety === 'Best').length;
        const safetyGood = vehicles.filter(v => v.safety === 'Good').length;
        const safetyCaution = vehicles.filter(v => v.safety === 'Caution').length;
    
        const deviceOn = vehicles.filter(v => v.device === 'On').length;
        const deviceCheck = vehicles.filter(v => v.device === 'Check').length;
        const deviceOff = vehicles.filter(v => v.device === 'Off').length;
    
        // ✅ 지역별 차량 개수 계산
        const regionCounts = {
            Seoul: vehicles.filter(v => calculateDistance(
                v.marker.getPosition().getLat(), 
                v.marker.getPosition().getLng(), 
                regions[0].lat, 
                regions[0].lng
            ) < 50).length, // 반경을 30km로 확장
            Gyeonggi: vehicles.filter(v => calculateDistance(
                v.marker.getPosition().getLat(), 
                v.marker.getPosition().getLng(), 
                regions[1].lat, 
                regions[1].lng
            ) < 50).length,
            Jeju: vehicles.filter(v => calculateDistance(
                v.marker.getPosition().getLat(), 
                v.marker.getPosition().getLng(), 
                regions[2].lat, 
                regions[2].lng
            ) < 50).length,
            Ulsan: vehicles.filter(v => calculateDistance(
                v.marker.getPosition().getLat(), 
                v.marker.getPosition().getLng(), 
                regions[3].lat, 
                regions[3].lng
            ) < 50).length
        };

         // ✅ VEHICLE 상태 업데이트
    animateValueChange(document.getElementById("drive-count"), driveCount);
    animateValueChange(document.getElementById("stop-count"), stopCount);
    animateValueChange(document.getElementById("ready-count"), readyCount);

    animateValueChange(document.getElementById("safety-best"), safetyBest);
    animateValueChange(document.getElementById("safety-good"), safetyGood);
    animateValueChange(document.getElementById("safety-caution"), safetyCaution);

    animateValueChange(document.getElementById("device-on"), deviceOn);
    animateValueChange(document.getElementById("device-check"), deviceCheck);
    animateValueChange(document.getElementById("device-off"), deviceOff);

// 대시보드 주기적 업데이트
setInterval(updateDashboard, 5000);

// **추가된 함수**
const dashboardSections = document.querySelectorAll('.section');

function updateSectionValues() {
    dashboardSections.forEach(section => {
        const titleText = section.querySelector('.title').innerText;

        const infoItems = section.querySelectorAll('.info-item span:last-child');
        const valueElement = section.querySelector('.value');

        let greenCount = 0;
        infoItems.forEach(item => {
            const color = window.getComputedStyle(item.previousElementSibling).color;
            if (color === 'rgb(0, 128, 0)') {
                greenCount += parseInt(item.textContent, 10);
            }
        });

        const totalCount = Array.from(infoItems).reduce((sum, item) => sum + parseInt(item.textContent, 10), 0);

        if (titleText.includes("AREA")) {
            // ✅ AREA 값이 0이면 42로 복구
            if (parseInt(valueElement.textContent) === 0) {
                valueElement.textContent = '42';
            }
            return;
        }

        if (totalCount > 0) {
            valueElement.textContent = `${Math.round((greenCount / totalCount) * 100)}`;
        } else {
            valueElement.textContent = '20';
        }
    });
}

setInterval(() => {
    updateDashboard();
    updateSectionValues();
}, 5000);  

function updateTextElement(id, newValue) {
    const element = document.getElementById(id);
    if (parseInt(element.innerText) !== newValue) {
        element.innerText = newValue;
    }
}

function updateDashboard() {
    updateTextElement('drive-count', driveCount);
    updateTextElement('stop-count', stopCount);
    updateTextElement('ready-count', readyCount);
}

function updateDashboardWithOrder() {
    updateDashboard();
    updateSectionValues();
}

setInterval(updateDashboardWithOrder, 5000)

    }
    setInterval(() => {
        vehicles.forEach(vehicle => {
            vehicle.device = ['On', 'Check', 'Off'][Math.floor(Math.random() * 3)]; // Device 상태 변경
        });
        updateDashboard(); // 대시보드 업데이트
    }, 10000);

    // **대시보드 토글 기능 추가**
    const dashboard = document.getElementById('dashboard');
    let isDashboardVisible = false;

    toggleButton.addEventListener('click', () => {
        if (isDashboardVisible) {
            dashboard.classList.add('hidden'); // 대시보드 숨김
            toggleButton.innerHTML = '«'; // 버튼 표시 변경
        } else {
            dashboard.classList.remove('hidden'); // 대시보드 보임
            toggleButton.innerHTML = '»'; // 버튼 표시 변경
        }
        isDashboardVisible = !isDashboardVisible;
    });
});

