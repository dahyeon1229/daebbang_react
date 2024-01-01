import { useState, useEffect } from "react";
import Post from '../../js/Post';
import style from '../css/EstateInsert.module.css';

function EstateInsert1({ realEstate, setRealEstate }) {
  const { kakao } = window;

  // 우편 번호
  const [enroll_company, setEnroll_company] = useState({
    zipcode: '',
    address1: '',
    address2: ''
  });

  useEffect(() => {
    setRealEstate(prev => ({
      ...prev,
      zipcode: enroll_company.zipcode,
      address1: enroll_company.address1,
      address2: enroll_company.address2
    }));

    handleGeocoding(enroll_company.address1);
  }, [enroll_company]);


  // 좌표 입력
  const handleGeocoding = (address1) => {
    // 주소-좌표 변환 객체를 생성합니다
    const geocoder = new kakao.maps.services.Geocoder();

    // 주소로 좌표를 검색합니다
    geocoder.addressSearch(address1, function (result, status) {
      // 정상적으로 검색이 완료됐으면
      if (status === kakao.maps.services.Status.OK) {
        const coords = new kakao.maps.LatLng(result[0].y, result[0].x);

        // 결과값으로 받은 위치를 realEstate 객체에 자동 입력합니다
        setRealEstate(prevState => ({
          ...prevState,
          latitude: result[0].y,
          longitude: result[0].x
        }));

        // ... (마커, 인포윈도우 설정 등 이전 코드와 동일한 부분)
      }
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // 숫자 또는 소수점 이외의 문자는 제거
    const sanitizedValue = value.replace(/[^0-9.]/g, "");

    if (name === 'area') {
      setRealEstate(prev => ({ ...prev, [name]: sanitizedValue }));
    } else {
      setRealEstate(prev => ({ ...prev, [name]: value }));
    }
  }

  return (
    <>
      <div className={style.titleDiv}>
        <h1 className={style.title}>매물 정보</h1>
        <p><span className={style.star}>*</span> 필수입력 항목</p>
      </div>
      <table className={style.estateTable}>
        <tr>
          <th>종류 선택<span className={style.star}>*</span></th>
          <td>
            <input type="radio" id="r1" name="roomCode" value="r1" onChange={handleChange} /><label className={style.inputLabel} htmlFor="r1">원룸</label>
          </td>
        </tr>
        <tr>
          <th>구조 선택<span className={style.star}>*</span></th>
          <td>
            <input type="radio" id="s1" name="structureCode" value="s1" onChange={handleChange} /><label className={style.inputLabel} htmlFor="s1">오픈형 원룸</label>
            <input type="radio" id="s2" name="structureCode" value="s2" onChange={handleChange} /><label className={style.inputLabel} htmlFor="s2">분리형 원룸</label>
            <input type="radio" id="s3" name="structureCode" value="s3" onChange={handleChange} /><label className={style.inputLabel} htmlFor="s3">복층형 원룸</label>
          </td>
        </tr>
        <tr>
          <th>건물 유형<span className={style.star}>*</span></th>
          <td>
            <input type="radio" id="b1" name="buildingCode" value="b1" onChange={handleChange} /><label className={style.inputLabel} htmlFor="b1">단독주택</label>
            <input type="radio" id="b2" name="buildingCode" value="b2" onChange={handleChange} /><label className={style.inputLabel} htmlFor="b2">다가구주택</label>
            <input type="radio" id="b3" name="buildingCode" value="b3" onChange={handleChange} /><label className={style.inputLabel} htmlFor="b3">빌라/연립/다세대</label>
            <input type="radio" id="b4" name="buildingCode" value="b4" onChange={handleChange} /><label className={style.inputLabel} htmlFor="b4">상가주택</label>
          </td>
        </tr>
        <tr>
          <th>주소<span className={style.star}>*</span></th>
          <td>
            <div>
              <div>
                <input type="text" placeholder="우편번호" name="zipcode" onChange={handleChange} value={enroll_company.zipcode} /><Post company={enroll_company} setcompany={setEnroll_company}></Post>
              </div>
              <div>
                <input type="text" placeholder="주소" name="address1" onChange={handleChange} value={enroll_company.address1} />
              </div>
            </div>
          </td>
        </tr>
        <tr>
          <th>매물크기<span className={style.star}>*</span></th>
          <td>
            <div>전용면적</div>
            <div className={style.scaleDiv}>
              <input type="text" pattern="[0-9]*\.?[0-9]*" className={style.scaleInput} name="area" onChange={handleChange} value={realEstate.area} />
              <p className={style.scale}>평</p>
            </div>
            =
            <div className={style.scaleDiv}>
              <input type="text" className={style.scaleInput} value={isNaN(realEstate.area) ? 0 : (realEstate.area * 3.30578).toFixed(2)} readOnly />
              <p className={style.scale}>㎡</p>
            </div>
          </td>
        </tr>
        <tr>
          <th>난방 종류<span className={style.star}>*</span></th>
          <td>
            <input type="radio" id="h1" name="heatingCode" value="h1" onChange={handleChange} /><label className={style.inputLabel} htmlFor="h1">개별난방</label>
            <input type="radio" id="h2" name="heatingCode" value="h2" onChange={handleChange} /><label className={style.inputLabel} htmlFor="h2">중앙난방</label>
          </td>
        </tr>
      </table>
    </>
  );
}

export default EstateInsert1;
