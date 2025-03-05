import React, { useState } from "react";
import "./AdminAddIVSuccessPage.css";
import Header from "../../../Components/Header";
import Footer from "../../../Components/Footer";
import { Link } from "react-router-dom";

export default function AdminAddIVSuccess() {
  return (
    <>
      <Header />
      <div className= "main-container9">
      <div className="container9">
        <div className="card9">
          <h1 className="title9">Successful!</h1>
          <div className="png9"></div>
          <p className="message9">
            Your Image or Video has been Successfully Uploaded.
          </p>
          <Link to='/AdminSearch'> <button className="button9">Go to Search Attraction</button></Link> 
          <p className="support-text9">
            If you face any issues, contact our support team.
          </p>
        </div>
      </div>

      </div>

      <Footer />
    </>
  );
}
