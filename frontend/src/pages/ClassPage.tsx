import schedule from "../assets/images/class/schedule.png";

function ClassPage() {
    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-lg-10 text-center">

                    <h1 className="mb-4">수업 시간 및 수강료 안내</h1>

                    <div className="card shadow-sm">
                        <div className="card-body">
                            <img
                                src={schedule}
                                alt="학원 수업 시간표 및 수강료"
                                className="img-fluid rounded"
                            />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default ClassPage;