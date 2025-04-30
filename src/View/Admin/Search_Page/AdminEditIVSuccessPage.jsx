import React, { useState } from "react";
import "./AdminEditIVSuccessPage.css";
import Header from "../../../Components/Admin Header/Admin-Header";
import Footer from "../../../Components/Footer/AuthFooter";
import { Link, useNavigate } from "react-router-dom";

export default function AdminEditIVSuccess() {
  return (
    <>
      <Header />
      <div className= "main-container10">
        <div className="container10">
            <div className="card10">
            <h1 className="title10">Successful!</h1>
            <div className="png10"></div>
            <p className="message10">
                Your Image or Video has been Edited Successfully.
            </p>
            <Link to='/AdminSearch'> <button className="button10">Go to Search Attraction</button></Link> 
            <p className="support-text10">
                If you face any issues, contact our support team.
            </p>
            </div>
        </div>
    </div>
    <Footer />
    </>
  );
}
