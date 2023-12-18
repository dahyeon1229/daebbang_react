import style from '../Write/WriteReview.module.css';
import fav from '../assets/favorites.png';
import notFav from '../assets/notFavorite.png';
import axios from "axios";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

const EditReview = () => {

    const location = useLocation();
    const navi = useNavigate();
    const seq=0;
    const [formData, setFormData] = useState({ seq:seq, traffic: "", surroundings: "", facility: "", files: {} });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }

    const [url, setUrl] = useState({ files0: "", files1: "", files2: "", files3: "", files4: "" });
    const handleFileChange = async (e) => {
        const files = e.target.files[0];

        const formImg = new FormData();
        formImg.append("files", files);
        formImg.append("path", "review");

        try {
            const imgUrl = await axios.post("/api/file/upload", formImg);
            setUrl(prev => ({ ...prev, [e.target.name]: imgUrl.data[0] }));
            setFormData(prev => ({ ...prev, files: { ...prev.files, [e.target.name]: files } }));
        } catch (err) {
            alert("이미지 첨부에 실패하였습니다");
            console.log(err);
        }
    }

    const imgDel = (files) => {
        setUrl(prev=>({...prev,[files]:""}));
        setFormData(prev=>({...prev,files:{...prev.files,[files]:""}}))
    }

    const [score, setScore] = useState({ 0: false, 1: false, 2: false, 3: false, 4: false });
    const addScore = (seq) => {
        let array = {};
        for (let i = 0; i <= seq; i++) {
            array = { ...array, [i]: true };
        }
        setScore(prev => ({ ...prev, ...array }));
    }

    const delScore = (seq) => {
        let array = {};
        for (let i = 5; i > seq; i--) {
            array = { ...array, [i]: false };
        }
        setScore(prev => ({ ...prev, ...array }))
    }

    const handleAdd = () => {
        let totalScore = Object.values(score).reduce((accumulator, currentValue) => accumulator + currentValue, 0);
        console.log(totalScore)
        if(totalScore===0){
            alert("별점을 입력해주세요");
            return;
        }

        if(formData.traffic===""){
            alert("교통 리뷰를 입력해주세요");
            return;
        }

        if(formData.surroundings===""){
            alert("주변 환경 리뷰를 입력해주세요");
            return;
        }

        if(formData.facility===""){
            alert("시설 리뷰를 입력해주세요");
            return;
        }

        console.log(formData.files);
        const submitFormData = new FormData();
        submitFormData.append("traffic",formData.traffic);
        submitFormData.append("surroundings",formData.surroundings);
        submitFormData.append("facility",formData.facility);
        submitFormData.append("score",totalScore);

        let filesList = Object.values(formData.files);
        
        filesList.forEach((e)=>{
            if(e!==""){
                console.log(e);
                submitFormData.append("files",e);
            }
        })
        
        axios.post("/api/review",submitFormData).then(resp=>{
            alert("리뷰 등록에 성공하였습니다");
            navi("/");
        }).catch(err=>{
            alert("리뷰 등록에 실패하였습니다");
            console.log(err);
        })

    }

   
    return (
        <>
            <div>매물 번호 : {}</div>
            <div className={style.scoreBox}>
                <div>
                    {
                        score[0] ? <img src={fav} alt="..." onClick={() => delScore(0)} /> : <img src={notFav} alt="..." onClick={() => addScore(0)} />
                    }
                </div>
                <div>
                    {
                        score[1] ? <img src={fav} alt="..." onClick={() => delScore(1)} /> : <img src={notFav} alt="..." onClick={() => addScore(1)} />
                    }
                </div>
                <div>
                    {
                        score[2] ? <img src={fav} alt="..." onClick={() => delScore(2)} /> : <img src={notFav} alt="..." onClick={() => addScore(2)} />
                    }
                </div>
                <div>
                    {
                        score[3] ? <img src={fav} alt="..." onClick={() => delScore(3)} /> : <img src={notFav} alt="..." onClick={() => addScore(3)} />
                    }
                </div>
                <div>
                    {
                        score[4] ? <img src={fav} alt="..." onClick={() => delScore(4)} /> : <img src={notFav} alt="..." onClick={() => addScore(4)} />
                    }
                </div>
            </div>
            <hr />
            <div>
                <div>교통</div>
                <div>
                    <textarea placeholder="교통 리뷰 입력" onChange={handleChange} name="traffic"></textarea>
                </div>
            </div>
            <div>
                <div>주변 환경</div>
                <div>
                    <textarea placeholder="주변 환경 리뷰 입력" onChange={handleChange} name="surroundings"></textarea>
                </div>
            </div>
            <div>
                <div>시설</div>
                <div>
                    <textarea placeholder="시설 리뷰 입력" onChange={handleChange} name="facility"></textarea>
                </div>
            </div>
            <hr />
            <div>
                <div className={style.imgInfo}>
                    <div>사진 첨부 |&nbsp;</div>
                    <div>10MB 이하 파일만 등록 가능</div>
                </div>
                <div className={style.imgBox}>
                    <input type="file" name="files0" style={{ display: 'none' }} id="fileInput0" onChange={handleFileChange} accept="image/*" />
                    <input type="file" name="files1" style={{ display: 'none' }} id="fileInput1" onChange={handleFileChange} accept="image/*" />
                    <input type="file" name="files2" style={{ display: 'none' }} id="fileInput2" onChange={handleFileChange} accept="image/*" />
                    <input type="file" name="files3" style={{ display: 'none' }} id="fileInput3" onChange={handleFileChange} accept="image/*" />
                    <input type="file" name="files4" style={{ display: 'none' }} id="fileInput4" onChange={handleFileChange} accept="image/*" />
                    <div>
                        {url.files0 ?
                            <>
                                <img src={url.files0} alt="..." />
                                <label onClick={() => imgDel("files0")}><FontAwesomeIcon icon={faXmark} size="2xs" /></label>
                            </> :
                            <label htmlFor="fileInput0"><FontAwesomeIcon icon={faPlus} size="2xs" /></label>
                        }

                    </div>
                    <div>
                        {url.files1 ?
                            <>
                                <img src={url.files1} alt="..." />
                                <label onClick={() => imgDel("files1")}><FontAwesomeIcon icon={faXmark} size="2xs" /></label>
                            </> :
                            <label htmlFor="fileInput1"><FontAwesomeIcon icon={faPlus} size="2xs" /></label>

                        }
                    </div>
                    <div>
                        {url.files2 ?
                            <>
                                <img src={url.files2} alt="..." />
                                <label onClick={() => imgDel("files2")}><FontAwesomeIcon icon={faXmark} size="2xs" /></label>
                            </> :
                            <label htmlFor="fileInput2"><FontAwesomeIcon icon={faPlus} size="2xs" /></label>

                        }
                    </div>
                    <div>
                        {url.files3 ?
                            <>
                                <img src={url.files3} alt="..." />
                                <label onClick={() => imgDel("files3")}><FontAwesomeIcon icon={faXmark} size="2xs" /></label>
                            </> :
                            <label htmlFor="fileInput3"><FontAwesomeIcon icon={faPlus} size="2xs" /></label>

                        }
                    </div>
                    <div>
                        {url.files4 ?
                            <>
                                <img src={url.files4} alt="..." />
                                <label onClick={() => imgDel("files4")}><FontAwesomeIcon icon={faXmark} size="2xs" /></label>
                            </> :
                            <label htmlFor="fileInput4"><FontAwesomeIcon icon={faPlus} size="2xs" /></label>

                        }
                    </div>
                </div>
            </div>
            <hr />
            <div>
                <button>작성 취소</button>
                <button onClick={handleAdd}>리뷰 등록</button>
            </div>
        </>
    );
}

export default EditReview;