import { useState, useEffect } from "react";
import { Button } from 'reactstrap';
import axios from "axios";
import { Link } from "react-router-dom";
import style from '../css/ReviewApproval.module.css';
import Pagination from "@mui/material/Pagination";

function ReviewApproval() {
  const [reviewApproval, setReviewApproval] = useState([]);

  useEffect(() => {
    axios.get(`/api/reviewApproval/agentReview/${sessionStorage.getItem('loginId')}`)
      .then((resp) => {
        setReviewApproval(resp.data);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const countPerPage = 10;
  const sliceContentsList = (list) => {
    const start = (currentPage - 1) * countPerPage;
    const end = start + countPerPage;
    return list.slice(start, end);
  }
  const currentPageHandle = (event, currentPage) => {
    setCurrentPage(currentPage);
  }

  const pagenation = () => {
    return <Pagination count={Math.ceil(reviewApproval.length / countPerPage)} page={currentPage} onChange={currentPageHandle} />;
  }

  const contentslist = () => {
    const slicedReviewApproval = sliceContentsList(reviewApproval);

    if (slicedReviewApproval.length === 0) {
      return (
        <tr>
          <td colSpan="5">No data available</td>
        </tr>
      );
    } else {
      return slicedReviewApproval.map(boardItem);
    }


  };

  const boardItem = (item, i) => {
    const handleApproval = () => {
      const updatedReviewApproval = [...reviewApproval];
      if (item.approvalCode === 'a2') {
        updatedReviewApproval[i] = { ...item, approvalCode: 'a1' };
      } else {
        updatedReviewApproval[i] = { ...item, approvalCode: 'a2' };
      }

      setReviewApproval(updatedReviewApproval);

      axios.put(`/api/reviewApproval/updateStatus/${item.seq}`, { approvalCode: updatedReviewApproval[i].approvalCode })
        .then(resp => {
        })
        .catch(error => {
          console.error("Error:", error);
        });
    };

    const getApprovalStatus = () => {
      if (item.approvalCode === 'a1') {
        return '미결';
      } else if (item.approvalCode === 'a2') {
        return '공인중개사 승인';
      } else if (item.approvalCode === 'a4') {
        return '취소';
      }
      return '';
    };

    const handleCancel = () => {
      const updatedReviewApproval = [...reviewApproval];

      if (item.approvalCode === 'a4') {
        updatedReviewApproval[i] = { ...item, approvalCode: 'a1' };
      } else {
        updatedReviewApproval[i] = { ...item, approvalCode: 'a4' };
      }

      setReviewApproval(updatedReviewApproval);

      axios.put(`/api/reviewApproval/updateStatus/${item.seq}`, { approvalCode: updatedReviewApproval[i].approvalCode })
        .then(resp => {
        })
        .catch(error => {
          console.error("Error:", error);
        });
    };

    return (
      <tr key={i}>
        <td>{item.userId}</td>
        <td>{item.phone}</td>
        <td><Link to={`/estateManage/estateInfo/${item.estateCode}`} className={style.infoLink} >{item.estateCode}</Link></td>
        <td>{getApprovalStatus()}</td>
        <td>
          <Button className={style.approvalBtn} onClick={handleApproval}>권한 부여</Button>
          <Button color="danger" onClick={handleCancel}>취소</Button>
        </td>
      </tr>
    );
  }

  return (
    <div className={style.container}>
      <h1 className={style.bigTitle}>문의 관리</h1>
      <table className={style.estateTable}>
        <thead>
          <tr>
            <th>신청인</th>
            <th>전화번호</th>
            <th>매물번호</th>
            <th>권한</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {contentslist()}
        </tbody>
      </table>

      <div className={style.naviFooter}>
        {pagenation()}
      </div>
    </div>
  );
}

export default ReviewApproval;
