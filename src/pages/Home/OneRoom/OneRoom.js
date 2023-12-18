//
import { Routes, Route, useNavigate } from "react-router-dom"; // Link
import { useState, useEffect, useRef } from "react";
import { Map, MapMarker, MarkerClusterer } from "react-kakao-maps-sdk"; // ZoomControl

//
// import { markerdata } from "./data/markerData"; // 마커 데이터 가져오기

//
import $ from "jquery";
import axios from "axios";

//
import List from "./List/List";
import Info from "./Info/Info";

//
import style from "./OneRoom.module.css";
import "./SliderToggle.css";
import "./RangeSlider.css";

function OneRoom() {
  const [mapRendered, setMapRendered] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(6);

  const [mapList, setMapList] = useState([{}]);
  // const [markersInBounds, setMarkersInBounds] = useState([]);
  // const [positions, setPositions] = useState([]);

  const [searchValue, setSearchValue] = useState("");
  const searchListBoxRef = useRef(null);

  const navigate = useNavigate();

  // NPM INSTALL 하면서 받은 카카오 정보들이
  // 로컬에 저장되어 있기 때문에 불러옴
  const { kakao } = window;

  // 1. 로딩 될때 지도 데이터 받음
  // 2. 전부 받고 맵 리스트에 저장하면 랜더링 완료 처리
  useEffect(() => {
    axios
      .get(`/api/map/getAll`)
      .then((resp) => {
        setMapList(resp.data);
        setMapRendered(true);
      })
      .catch((err) => {
        console.log("API 호출 오류:", err);
      });
  }, []);

  // 1. 랜더링 변경 값이 있을때 의존성 실행
  // 2. 랜더링이 완료로 변경되면 이벤트 드레그 실행
  useEffect(() => {
    if (mapRendered) {
      handleDragEnd();
    }
  }, [mapRendered]);

  // 페이지 로딩 시 사용할 기본 경계 반환
  const getDefaultBounds = () => {
    return new kakao.maps.LatLngBounds(
      new kakao.maps.LatLng(36, 127),
      new kakao.maps.LatLng(37, 128)
    );
  };

  // 지도에서 마우스 드레그 이벤트 발생시 마커 새로 불러오기
  const handleDragEnd = (map) => {
    // map 인자가 받지 못한건 처음 페이지 켤때니까
    // get Bouns에 기본 바운스를 넣어줌 안 그럼 맵이 없어서 값이 없음
    if (!map) {
      map = {
        getBounds: () => getDefaultBounds(),
      };
    }

    // 현재 지도의 경계를 맵 인자에서 가져옴
    const bounds = map.getBounds();

    // 경계(현재 화면)에 포함된 마커들 찾기
    const markersInBounds = mapList.filter((marker) => {
      const markerPosition = new kakao.maps.LatLng(
        marker.latitude,
        marker.longitude
      );
      return bounds.contain(markerPosition);
    });

    // 이벤트가 발생하면 페이지 이동
    navigate("/home/oneroom/list", { state: { markersInBounds } });
  };

  // 지도에서 휠을 활용한 줌 이벤트 발생시 마커 새로 불러오기
  const handleZoomChanged = (map) => {
    // Zoom level이 변경되면 페이지 이동
    setZoomLevel(map.getLevel());

    // 현재 지도의 경계를 맵 인자에서 가져옴
    const bounds = map.getBounds();

    // 경계(현재 화면)에 포함된 마커들 찾기
    const markersInBounds = mapList.filter((marker) => {
      const markerPosition = new kakao.maps.LatLng(
        marker.latitude,
        marker.longitude
      );
      return bounds.contain(markerPosition);
    });

    // 이벤트가 발생하면 페이지 이동하면서 바뀐 경계 (현재 화면) 값을 넘김
    navigate(`/home/oneroom/list?zoom=${map.getLevel()}`, {
      state: { markersInBounds },
    });
  };

  // 마커를 클릭할때 해당 정보를 들고 info(정보)로 이동
  const handleMarkerClick = (marker) => {
    navigate("/home/oneroom/info", { state: marker });
  };

  // 검색창 사용
  const handleInputChange = (event) => {
    // 받은 데이터의 길이 (2글자 이상인지 체크하기 위한거임)
    const inputValue = event.target.value;
    setSearchValue(inputValue);

    // 리스트 박스를 찾기 위해서 쓰는 Ref
    const searchListBox = searchListBoxRef.current;

    // 2글자 이상일 때 active 클래스를 추가하고, display를 block으로 설정
    if (inputValue.length >= 2) {
      // 숨겨놨던 리스트 Div를 풀어줌
      searchListBox.classList.add(style.active);
      searchListBox.style.display = "block";

      axios
        .get(`/api/map/getKeywordSearch`, {
          params: {
            keyword: inputValue, // inputValue를 'keyword'라는 이름으로 전달
          },
        })
        .then((resp) => {
          // resp.data를 순회하며 각 지역의 시군구 정보를 <div>에 추가
          const examDiv = document.querySelector(".exam");
          searchListBox.innerHTML = ""; // 기존 내용을 초기화

          // 검색된 데이터가 없을때
          if (
            resp.data.regionList.length === 0 &&
            resp.data.subwayList.length === 0 &&
            resp.data.schoolList.length === 0
          ) {
            // NULL 값일때 List에 넣을 CSS를 사용하기 위해 만드는 마크업
            const nullRegionSpan = document.createElement("span");
            const nullRegionDiv = document.createElement("div");

            nullRegionSpan.textContent = `검색된 항목이 없습니다.`;
            nullRegionDiv.appendChild(nullRegionSpan);
            searchListBox.appendChild(nullRegionDiv);
          }

          // 각 지역에 대한 검색
          // region에는 각 지역 정보가 들어 있음
          resp.data.regionList.forEach((region) => {
            // List에 넣을 CSS를 사용하기 위해 만드는 마크업
            const regionSpan = document.createElement("span");
            const regionDiv = document.createElement("div");

            // 리에 대한 검색
            if (region.re) {
              // 메인 상단 대표 검색된 키워드
              regionSpan.textContent = `${region.re}`;

              // 상세 주소
              const regionText = document.createTextNode(
                `${region.sido} ${region.sigungu} ${region.eup_myeon_re_dong} ${region.re}`
              );

              // Span 태그(메인 상단 키워드), 일반 Text (상세 주소) Div에 추가
              // 이후 List에 만들어진 Div 추가
              regionDiv.appendChild(regionSpan);
              regionDiv.appendChild(regionText);
              searchListBox.appendChild(regionDiv);

              // 읍면리동에 대한 검색
            } else if (region.eup_myeon_re_dong && !region.re) {
              regionSpan.textContent = `${region.eup_myeon_re_dong}`;

              const regionText = document.createTextNode(
                `${region.sido} ${region.sigungu} ${region.eup_myeon_re_dong}`
              );

              regionDiv.appendChild(regionSpan);
              regionDiv.appendChild(regionText);
              searchListBox.appendChild(regionDiv);

              // 읍면동구에 대한 검색
            } else if (
              region.eup_myeon_dong_gu &&
              !region.eup_myeon_re_dong &&
              !region.re
            ) {
              regionSpan.textContent = `${region.eup_myeon_dong_gu}`;

              const regionText = document.createTextNode(
                `${region.sido} ${region.sigungu}`
              );

              regionDiv.appendChild(regionSpan);
              regionDiv.appendChild(regionText);
              searchListBox.appendChild(regionDiv);
            }

            // 시군구에 대한 검색
            else if (
              region.sigungu &&
              !region.eup_myeon_dong_gu &&
              !region.eup_myeon_re_dong &&
              !region.re
            ) {
              regionSpan.textContent = `${region.sigungu}`;

              const regionText = document.createTextNode(
                `${region.sido} ${region.sigungu}`
              );

              regionDiv.appendChild(regionSpan);
              regionDiv.appendChild(regionText);
              searchListBox.appendChild(regionDiv);
            }

            // 시도에 대한 검색
            else if (
              region.sido &&
              !region.sigungu &&
              !region.eup_myeon_dong_gu &&
              !region.eup_myeon_re_dong &&
              !region.re
            ) {
              regionSpan.textContent = `${region.sido}`;

              const regionText = document.createTextNode(`${region.sido}`);

              regionDiv.appendChild(regionSpan);
              regionDiv.appendChild(regionText);
              searchListBox.appendChild(regionDiv);
            }
          });

          // 지하철역에 대한 검색
          // subway 각 지역 정보가 들어 있음
          resp.data.subwayList.forEach((subway) => {
            // List에 넣을 CSS를 사용하기 위해 만드는 마크업
            const subwaySpan = document.createElement("span");
            const subwayDiv = document.createElement("div");

            // 메인 상단 대표 검색된 키워드
            subwaySpan.textContent = `${subway.name}`;

            // 상세 주소
            const subwayText = document.createTextNode(`${subway.address}`);

            // Span 태그(메인 상단 키워드), 일반 Text (상세 주소) Div에 추가
            // 이후 List에 만들어진 Div 추가
            subwayDiv.appendChild(subwaySpan);
            subwayDiv.appendChild(subwayText);
            searchListBox.appendChild(subwayDiv);
          });

          // 대학교에 대한 검색
          // subway 각 지역 정보가 들어 있음
          resp.data.schoolList.forEach((school) => {
            // List에 넣을 CSS를 사용하기 위해 만드는 마크업
            const subwaySpan = document.createElement("span");
            const subwayDiv = document.createElement("div");

            // 메인 상단 대표 검색된 키워드
            subwaySpan.textContent = `${school.name}`;

            // 상세 주소
            const subwayText = document.createTextNode(`${school.address}`);

            // Span 태그(메인 상단 키워드), 일반 Text (상세 주소) Div에 추가
            // 이후 List에 만들어진 Div 추가
            subwayDiv.appendChild(subwaySpan);
            subwayDiv.appendChild(subwayText);
            searchListBox.appendChild(subwayDiv);
          });
        })
        .catch((err) => {
          console.log("API 호출 오류:", err);
        });
    } else if (inputValue.length === 0) {
      // 2글자 미만일 때 active 클래스를 제거하고, display를 none으로 설정
      searchListBox.classList.remove(style.active);
      searchListBox.style.display = "none";
    }
  };

  // 토글이벤트 - 관리비
  const [isChecked, setChecked] = useState(false);

  const handleToggle = () => {
    setChecked(!isChecked);
  };

  // 토글이벤트 - 주차
  const [isToggled, setIsToggled] = useState(false);

  const handleCheckboxChange = () => {
    setIsToggled(!isToggled);
  };

  // 토글이벤트 - 단기임대
  const [isChecked2, setChecked2] = useState(false);

  const handleToggle2 = () => {
    setChecked2(!isChecked2);
  };

  // 양쪽 범위 슬라이더 - 보증금
  const [range, setRange] = useState({ left: 0, right: 100 });
  const [isDraggingLeft, setDraggingLeft] = useState(false);
  const [isDraggingRight, setDraggingRight] = useState(false);
  const sliderRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingLeft || isDraggingRight) {
        const { left: sliderLeft, width: sliderWidth } =
          sliderRef.current.getBoundingClientRect();
        let position = (e.clientX - sliderLeft) / sliderWidth;

        // Limit position to be within 0% and 100%
        position = Math.min(1, Math.max(0, position));

        if (isDraggingLeft) {
          setRange((prevRange) => ({ ...prevRange, left: position * 100 }));
        } else {
          setRange((prevRange) => ({ ...prevRange, right: position * 100 }));
        }
      }
    };

    const handleMouseUp = () => {
      setDraggingLeft(false);
      setDraggingRight(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingLeft, isDraggingRight]);

  const handleMouseDownLeft = () => {
    setDraggingLeft(true);
  };

  const handleMouseDownRight = () => {
    setDraggingRight(true);
  };

  // 양쪽 범위 슬라이더 - 월세
  const [rangeValues, setRangeValues] = useState({ start: 0, end: 100 });
  const [afterRangeValues, setAfterRangeValues] = useState({
    start: 0,
    end: 0,
  });
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  const sliderRef_month = useRef(null);

  useEffect(() => {
    // 설정
    // 0만원부터 ~ [0 ~ 5만원]까지
    if (rangeValues.start === 0 && rangeValues.end === 0) {
      setAfterRangeValues((prevValues) => ({
        ...prevValues,
        end: 5,
      }));

      // 0만원부터 ~ [5 ~ 500만원]까지
    } else if (rangeValues.start === 0 && rangeValues.end <= 99.9) {
      const returnNum = Math.floor(rangeValues.end / 5) + 1;

      // 0만원부터 ~ [5 ~ 40만원]까지
      if (1 < returnNum && returnNum <= 9) {
        setAfterRangeValues((prevValues) => ({
          ...prevValues,
          end: (returnNum - 1) * 5,
        }));
      }

      // 0만원부터 ~ [40 ~ 70만원]까지
      else if (9 < returnNum && returnNum <= 12) {
        setAfterRangeValues((prevValues) => ({
          ...prevValues,
          end: 40 + (returnNum - 9) * 10,
        }));
      }

      // 0만원부터 ~ [70 ~ 100만원]까지
      else if (12 < returnNum && returnNum <= 13) {
        setAfterRangeValues((prevValues) => ({ ...prevValues, end: 100 }));
      }

      // 0만원부터 ~ [150 ~ 300만원]까지
      else if (12 < returnNum && returnNum <= 17) {
        setAfterRangeValues((prevValues) => ({
          ...prevValues,
          end: 50 + (returnNum - 12) * 50,
        }));
      }

      // 0만원부터 ~ [300 ~ 500만원]까지
      else if (17 < returnNum && returnNum <= 19) {
        setAfterRangeValues((prevValues) => ({
          ...prevValues,
          end: 300 + (returnNum - 17) * 100,
        }));
      }

      // [0 ~ 500만원]부터 ~ 0만원 까지
    } else if (rangeValues.start >= 3 && rangeValues.end === 100) {
      const returnNum = Math.floor((rangeValues.start + 3) / 5);

      // [5만원]부터 ~ 0만원 까지
      if (returnNum === 0) {
        setAfterRangeValues((prevValues) => ({
          ...prevValues,
          start: 5,
        }));
      }

      // [10 ~ 40만원]부터 ~ 0만원 까지
      else if (1 <= returnNum && returnNum <= 9) {
        setAfterRangeValues((prevValues) => ({
          ...prevValues,
          start: returnNum * 5,
        }));
      }

      // [40 ~ 70만원]부터 ~ 0만원 까지
      else if (9 < returnNum && returnNum <= 12) {
        setAfterRangeValues((prevValues) => ({
          ...prevValues,
          start: 40 + (returnNum - 9) * 10,
        }));
      }

      // [70 ~ 100만원]부터 ~ 0만원 까지
      else if (12 < returnNum && returnNum <= 13) {
        setAfterRangeValues((prevValues) => ({
          ...prevValues,
          start: 100,
        }));
      }

      // [150 ~ 300만원]부터 ~ 0만원 까지
      else if (13 < returnNum && returnNum <= 17) {
        setAfterRangeValues((prevValues) => ({
          ...prevValues,
          start: 100 + (returnNum - 13) * 50,
        }));
      }

      // [300 ~ 500만원]부터 ~ 0만원 까지
      else if (17 < returnNum && returnNum <= 19) {
        setAfterRangeValues((prevValues) => ({
          ...prevValues,
          start: 300 + (returnNum - 17) * 100,
        }));
      }

      // [0 ~ 500만원]부터 ~ [0 ~ 500만원]까지 // 설정
    } else if (rangeValues.start >= 0.01 && rangeValues.end <= 99.9) {

      // 0만원부터 ~ [0 ~ 500만원] 까지에 사용할 상수
      const returnNum = Math.floor(rangeValues.end / 5) + 1;

      // 0만원부터 ~ [5 ~ 40만원]까지
      if (1 < returnNum && returnNum <= 9) {
        setAfterRangeValues((prevValues) => ({
          ...prevValues,
          end: (returnNum - 1) * 5,
        }));
      }

      // 0만원부터 ~ [40 ~ 70만원]까지
      else if (9 < returnNum && returnNum <= 12) {
        setAfterRangeValues((prevValues) => ({
          ...prevValues,
          end: 40 + (returnNum - 9) * 10,
        }));
      }

      // 0만원부터 ~ [300 ~ 500만원]까지
      else if (12 < returnNum && returnNum <= 13) {
        setAfterRangeValues((prevValues) => ({ ...prevValues, end: 100 }));
      }

      // [150 ~ 300만원]부터 ~ 0만원 까지
      else if (12 < returnNum && returnNum <= 17) {
        setAfterRangeValues((prevValues) => ({
          ...prevValues,
          end: 50 + (returnNum - 12) * 50,
        }));
      }

      // 0만원부터 ~ [300 ~ 500만원]까지
      else if (17 < returnNum && returnNum <= 19) {
        setAfterRangeValues((prevValues) => ({
          ...prevValues,
          end: 300 + (returnNum - 17) * 100,
        }));
      }

      // 만약 끝에 값을 다시 끝으로 땅기면 0으로 되돌려서 초기값 설정
      else {
        setAfterRangeValues((prevValues) => ({
          ...prevValues,
          end: 0,
        }));
      }

      // [0 ~ 500만원]부터 ~ 0만원까지에 사용할 상수
      const returnNum2 = Math.floor((rangeValues.start + 3) / 5);

      // 만약 끝에 값을 다시 끝으로 땅기면 0으로 되돌려서 초기값 설정
      if (returnNum2 === 0) {
        setAfterRangeValues((prevValues) => ({
          ...prevValues,
          start: 0,
        }));
      }

      // [5 ~ 40만원]부터 0만원까지
      else if (1 <= returnNum2 && returnNum2 <= 9) {
        setAfterRangeValues((prevValues) => ({
          ...prevValues,
          start: returnNum2 * 5,
        }));
      }

     // [40 ~ 70만원]부터 0만원까지
      else if (9 < returnNum2 && returnNum2 <= 12) {
        setAfterRangeValues((prevValues) => ({
          ...prevValues,
          start: 40 + (returnNum2 - 9) * 10,
        }));
      }

      // [70 ~ 100만원]부터 0만원까지
      else if (12 < returnNum2 && returnNum2 <= 13) {
        setAfterRangeValues((prevValues) => ({
          ...prevValues,
          start: 100,
        }));
      }

      // [100 ~ 300만원]부터 0만원까지
      else if (13 < returnNum2 && returnNum2 <= 17) {
        setAfterRangeValues((prevValues) => ({
          ...prevValues,
          start: 100 + (returnNum2 - 13) * 50,
        }));
      }

      // [300 ~ 500만원]부터 0만원까지
      else if (17 < returnNum2 && returnNum2 <= 19) {
        setAfterRangeValues((prevValues) => ({
          ...prevValues,
          start: 300 + (returnNum2 - 17) * 100,
        }));
      }
    }

    // 만약 양쪽 끝 값이 다 최대로 들어가 있다면 0만원부터 0만원까지
    // 즉 전체로 다시 설정
    else if (rangeValues.start === 0 && rangeValues.end === 100) {
      setAfterRangeValues({ start: 0, end: 0 });
    }
  }, [rangeValues]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingStart || isDraggingEnd) {
        const { left: sliderLeft, width: sliderWidth } =
          sliderRef_month.current.getBoundingClientRect();
        let position = (e.clientX - sliderLeft) / sliderWidth;
        position = Math.min(1, Math.max(0, position));

        if (isDraggingStart) {
          setRangeValues((prevValues) => ({
            ...prevValues,
            start: position * 100,
          }));
        } else {
          setRangeValues((prevValues) => ({
            ...prevValues,
            end: position * 100,
          }));
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingStart(false);
      setIsDraggingEnd(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingStart, isDraggingEnd]);

  const handleMouseDownStart = () => {
    setIsDraggingStart(true);
  };

  const handleMouseDownEnd = () => {
    setIsDraggingEnd(true);
  };

  // 양쪽 범위 슬라이더 - 전세
  const [sliderValues, setSliderValues] = useState({ left: 0, right: 100 });
  const [isLeftHandleDragging, setIsLeftHandleDragging] = useState(false);
  const [isRightHandleDragging, setIsRightHandleDragging] = useState(false);
  const sliderCustomRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isLeftHandleDragging || isRightHandleDragging) {
        const { left: sliderLeft, width: sliderWidth } =
          sliderRef.current.getBoundingClientRect();
        let position = (e.clientX - sliderLeft) / sliderWidth;
        position = Math.min(1, Math.max(0, position));

        if (isLeftHandleDragging) {
          setSliderValues((prevValues) => ({
            ...prevValues,
            left: position * 100,
          }));
        } else {
          setSliderValues((prevValues) => ({
            ...prevValues,
            right: position * 100,
          }));
        }
      }
    };

    const handleMouseUp = () => {
      setIsLeftHandleDragging(false);
      setIsRightHandleDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isLeftHandleDragging, isRightHandleDragging]);

  const handleMouseDownLeftHandle = () => {
    setIsLeftHandleDragging(true);
  };

  const handleMouseDownRightHandle = () => {
    setIsRightHandleDragging(true);
  };

  return (
    <div>
      {/* {" "} */}
      {/* className="container"*/}
      <div className={style.home_top}>
        <div>방 찾기</div>
        <div>찜한 매물</div>
        <div>방 내놓기(전월세만)</div>
      </div>
      <div className={style.main_box}>
        <div className={style.home_body_map}>
          <div className={style.home_body_map_main}>
            {mapRendered && (
              <Map
                center={{ lat: 36.84142696925057, lng: 127.14542099214732 }}
                style={{ width: "100%", height: "100%" }}
                level={zoomLevel}
                onDragEnd={handleDragEnd}
                onZoomChanged={handleZoomChanged}
              >
                <MarkerClusterer
                  averageCenter={true}
                  minLevel={1}
                  calculator={[1, 2, 5]}
                  styles={[
                    {
                      // calculator 각 사이 값 마다 적용될 스타일을 지정한다
                      width: "30px",
                      height: "30px",
                      background: "rgba(51, 204, 255, .8)",
                      borderRadius: "15px",
                      color: "#000",
                      textAlign: "center",
                      fontWeight: "bold",
                      lineHeight: "31px",
                    },
                    {
                      width: "40px",
                      height: "40px",
                      background: "rgba(255, 153, 0, .8)",
                      borderRadius: "20px",
                      color: "#000",
                      textAlign: "center",
                      fontWeight: "bold",
                      lineHeight: "41px",
                    },
                    {
                      width: "50px",
                      height: "50px",
                      background: "rgba(255, 51, 204, .8)",
                      borderRadius: "25px",
                      color: "#000",
                      textAlign: "center",
                      fontWeight: "bold",
                      lineHeight: "51px",
                    },
                    {
                      width: "60px",
                      height: "60px",
                      background: "rgba(255, 80, 80, .8)",
                      borderRadius: "30px",
                      color: "#000",
                      textAlign: "center",
                      fontWeight: "bold",
                      lineHeight: "61px",
                    },
                  ]}
                >
                  {mapList.map((marker, index) => (
                    <MapMarker
                      key={index}
                      position={{ lat: marker.latitude, lng: marker.longitude }}
                      options={{ title: marker.title }}
                      onClick={() => handleMarkerClick(marker)}
                    />
                  ))}
                </MarkerClusterer>
              </Map>
            )}
          </div>
          {/* 검색창 */}
          <div className={style.home_body_map_search}>
            <div className={style.search_box}>
              {/* 검색 텍스트 입력 */}
              <input
                type="text"
                placeholder="지역, 지하철역, 학교 검색"
                value={searchValue}
                onChange={handleInputChange}
              ></input>

              {/* 검색창 리스트 X 아이콘 위치 설정 (display:none) */}
              <button>X</button>

              {/* 아이콘 */}
              <div className={style.search_icon}>ㅇ</div>
            </div>

            {/* 검색 옵션 선택 */}
            <div className={style.search_option}>
              <div>전월세 (~40만)</div>
              <div>구조 ･ 면적</div>
              <div>옵션</div>
              {/* <div>ㅇ</div> */}
            </div>
          </div>

          {/* 검색창 옵션 박스 위치 설정 (display:none / 이게 block 처리 되어야 밑에 box_1,2,3 이 나타남 )*/}
          <div className={style.search_option_box}>
            {/* 전월세 선택시 */}

            <div className={style.option_box_1}>
              <div>
                <span>거래유형</span>
                <div className={style.deal_type}>
                  <div className={style.deal_type_on}>전체</div>
                  <div>전세</div>
                  <div style={{ margin: "0px" }}>월세</div>
                </div>
              </div>

              {/* 월세 조건 선택했을 시 표출하는 토글버튼 (display : none) */}

              <div
                style={{
                  marginTop: "30px",
                  position: "relative",
                  display: "none",
                }}
              >
                <span>단기 임대만 보기</span>
                <div className={`slider-toggle ${isChecked2 ? "checked" : ""}`}>
                  <label className="switch" htmlFor="activeSwitch">
                    <input
                      type="checkbox"
                      id="activeSwitch"
                      checked={isChecked2}
                      onChange={handleToggle2}
                    />
                    <span className="slider"></span>
                  </label>
                  {/* <p>{isChecked ? 'The switch is ON' : 'The switch is OFF'}</p> */}
                </div>
              </div>

              {/* 보증금 범위 슬라이더 */}
              <div style={{ marginTop: "30px" }}>
                <span>보증금</span>

                <div className={style.option_range}>
                  <div className="range-slider" ref={sliderRef}>
                    <div className="range-bar-base-line"></div>
                    <div
                      className="range-bar"
                      style={{
                        left: range.left + "%",
                        width: range.right - range.left + "%",
                      }}
                    >
                      <div className="value_box">값</div>
                    </div>
                    <div
                      className="range-handle left"
                      style={{ left: range.left + "%" }}
                      onMouseDown={handleMouseDownLeft}
                    ></div>
                    <div
                      className="range-handle right"
                      style={{ left: range.right + "%" }}
                      onMouseDown={handleMouseDownRight}
                    ></div>
                    {/* <p>Left: {range.left}</p>
          <p>Right: {range.right}</p> */}
                  </div>

                  <div className="range_info_bar">
                    <div style={{ borderLeft: "1px solid #b3b3b3" }}></div>
                    <div
                      style={{
                        borderLeft: "1px solid #b3b3b3",
                        borderRight: "1px solid #b3b3b3",
                      }}
                    ></div>
                    <div style={{ borderRight: "1px solid #b3b3b3" }}></div>
                  </div>
                  <div className="range_info">
                    <div>최소</div>
                    <div style={{ marginLeft: "72px" }}>5천만</div>
                    <div style={{ marginLeft: "70px" }}>2.5억</div>
                    <div style={{ marginLeft: "70px" }}>최대</div>
                  </div>
                </div>
              </div>

              {/* 월세 범위 슬라이더 */}
              <div style={{ marginTop: "30px" }}>
                <span>월세</span>

                <div className={style.option_range}>
                  <div className="custom-range-slider" ref={sliderRef_month}>
                    <div className="range-bar-base-line"></div>
                    <div
                      className="range-bar"
                      style={{
                        left: rangeValues.start + "%",
                        width: rangeValues.end - rangeValues.start + "%",
                      }}
                    >
                      {/* 바로가기 */}
                      <div className="value_box">
                        {afterRangeValues.start === 0 &&
                        afterRangeValues.end === 0
                          ? "전체"
                          : afterRangeValues.start === 0
                          ? `${afterRangeValues.end}까지`
                          : afterRangeValues.end === 0
                          ? `${afterRangeValues.start}부터~`
                          : `${afterRangeValues.start}부터~${afterRangeValues.end}까지`}
                      </div>
                    </div>
                    <div
                      className="range-handle start"
                      style={{ left: rangeValues.start + "%" }}
                      onMouseDown={handleMouseDownStart}
                    ></div>
                    <div
                      className="range-handle end"
                      style={{ left: rangeValues.end + "%" }}
                      onMouseDown={handleMouseDownEnd}
                    ></div>
                  </div>

                  <div className="range_info_bar">
                    <div style={{ borderLeft: "1px solid #b3b3b3" }}></div>
                    <div
                      style={{
                        borderLeft: "1px solid #b3b3b3",
                        borderRight: "1px solid #b3b3b3",
                      }}
                    ></div>
                    <div style={{ borderRight: "1px solid #b3b3b3" }}></div>
                  </div>
                  <div className="range_info">
                    <div>최소</div>
                    <div style={{ marginLeft: "75px" }}>35만</div>
                    <div style={{ marginLeft: "73px" }}>150만</div>
                    <div style={{ marginLeft: "65px" }}>최대</div>
                  </div>
                </div>
              </div>

              {/* 전세 범위 슬라이더 ( 조건 선택시 [전세 조건 선택] 나오게 바꿔야함 / 현재 display:none )*/}

              <div style={{ marginTop: "30px", display: "none" }}>
                <span>전세</span>

                <div className={style.option_range}>
                  <div className="custom-range-slider" ref={sliderCustomRef}>
                    <div className="range-bar-base-line"></div>
                    <div
                      className="range-bar"
                      style={{
                        left: sliderValues.left + "%",
                        width: sliderValues.right - sliderValues.left + "%",
                      }}
                    >
                      <div className="value_box">값</div>
                    </div>
                    <div
                      className="range-handle left"
                      style={{ left: sliderValues.left + "%" }}
                      onMouseDown={handleMouseDownLeftHandle}
                    ></div>
                    <div
                      className="range-handle right"
                      style={{ left: sliderValues.right + "%" }}
                      onMouseDown={handleMouseDownRightHandle}
                    ></div>
                    {/* <p>Left: {sliderValues.left}</p>
        <p>Right: {sliderValues.right}</p> */}
                  </div>

                  <div className="range_info_bar">
                    <div style={{ borderLeft: "1px solid #b3b3b3" }}></div>
                    <div
                      style={{
                        borderLeft: "1px solid #b3b3b3",
                        borderRight: "1px solid #b3b3b3",
                      }}
                    ></div>
                    <div style={{ borderRight: "1px solid #b3b3b3" }}></div>
                  </div>
                  <div className="range_info">
                    <div>최소</div>
                    <div style={{ marginLeft: "75px" }}>35만</div>
                    <div style={{ marginLeft: "73px" }}>150만</div>
                    <div style={{ marginLeft: "65px" }}>최대</div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "30px", position: "relative" }}>
                <span>관리비 포함하여 찾기</span>
                <div className={`slider-toggle ${isChecked ? "checked" : ""}`}>
                  <label className="switch" htmlFor="toggleSwitch">
                    <input
                      type="checkbox"
                      id="toggleSwitch"
                      checked={isChecked}
                      onChange={handleToggle}
                    />
                    <span className="slider"></span>
                  </label>
                  {/* <p>{isChecked ? 'The switch is ON' : 'The switch is OFF'}</p> */}
                </div>
              </div>
            </div>

            {/* 구조면적 선택시 */}
            <div className={style.option_box_2}>
              <div>
                <span>구조</span>
                <div className={style.structure_box}>
                  {/* .structure_select div 테두리 지울 것 */}
                  <div className={style.structure_select}>
                    <div>아이콘</div>
                    <div>전체</div>
                  </div>

                  <div className={style.structure_select}>
                    <div>아이콘</div>
                    <div>오픈형(방1)</div>
                  </div>

                  <div className={style.structure_select}>
                    <div>아이콘</div>
                    <div>분리형(방1,거실1)</div>
                  </div>

                  <div className={style.structure_select}>
                    <div>아이콘</div>
                    <div>복층형</div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "30px" }}>
                <span>층 수 옵션</span>
                <div className={style.floor_box}>
                  {/* .structure_select div 테두리 지울 것 */}
                  <div>전체</div>

                  <div>지상층</div>

                  <div>반지하</div>

                  <div>옥탑</div>
                </div>
              </div>

              <div style={{ marginTop: "30px" }}>
                <span>전용 면적</span>
                <div className={style.area_box}>
                  {/* .structure_select div 테두리 지울 것 */}
                  <div style={{ borderTopLeftRadius: "4px" }}>전체</div>

                  <div>10평 이하</div>

                  <div>10평대</div>

                  <div
                    style={{ borderRight: "none", borderTopRightRadius: "4px" }}
                  >
                    20평대
                  </div>

                  <div
                    style={{
                      borderBottom: "none",
                      borderBottomLeftRadius: "4px",
                    }}
                  >
                    30평대
                  </div>

                  <div style={{ borderBottom: "none" }}>40평대</div>

                  <div style={{ borderBottom: "none" }}>50평대</div>

                  <div
                    style={{
                      borderRight: "none",
                      borderBottom: "none",
                      borderBottomRightRadius: "4px",
                    }}
                  >
                    60평 이상
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "30px", position: "relative" }}>
                <span>주차 가능만 보기</span>
                <div className={`slider-toggle ${isToggled ? "checked" : ""}`}>
                  <label className="switch" htmlFor="toggleSwitch_car">
                    <input
                      type="checkbox"
                      id="toggleSwitch_car"
                      checked={isToggled}
                      onChange={handleCheckboxChange}
                    />
                    <span className="slider"></span>
                  </label>
                  {/* <p>{isChecked ? 'The switch is ON' : 'The switch is OFF'}</p> */}
                </div>
              </div>
            </div>

            {/* 옵션 선택시 */}
            <div className={style.option_box_3}>
              <div>
                <span>매물 옵션</span>
                <div className={style.item_box}>
                  <div className={style.structure_select}>에어컨</div>

                  <div className={style.structure_select}>냉장고</div>

                  <div className={style.structure_select}>세탁기</div>
                </div>
              </div>
            </div>

            {/* 초기화, 확인 버튼 부분*/}
            <div className={style.option_btn_box}>
              <div className={style.option_reset}>초기화</div>
              <div className={style.option_check}>확인</div>
            </div>
          </div>

          {/* 검색창 리스트 박스 위치 설정 (display:none) */}
          <div className={style.search_list_box} ref={searchListBoxRef}>
            {/* 검색창 리스트 세부박스 아래와 같이 세팅할것 */}
          </div>
        </div>

        <div className={style.home_body_side}>
          <Routes>
            <Route path="list/*" element={<List />} />
            <Route path="info/*" element={<Info />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default OneRoom;
