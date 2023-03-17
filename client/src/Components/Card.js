const Card = (props) => {
    let { coin, price, margins, status, updated } = props;
    return (
        <div className="card">
            <div className="card-header">
                <div className="card-header-left">{coin}</div>
                <div className="card-header-right">
                    Status: &nbsp; <span className={status}></span>
                </div>
            </div>
            <div className="card-body">
                <div className="card-body-left">
                    <div className="card-body-left-item gray">Margin</div>
                    <div className="card-body-left-item">
                        <span className="reverse">{margins[0]}</span> &nbsp;
                        &nbsp;
                        <br />
                        <span className="straight">{margins[1]}</span>
                    </div>
                </div>
                <div className="card-body-right">
                    <div className="card-body-right-item gray">Last updated -</div>
                    <div className="card-body-right-item">
                        <span className="gray"> USDT:</span> {updated[0]}</div>
                    <div className="card-body-right-item">
                    <span className="gray">INR :</span> {updated[1]}</div>
                </div>
            </div>
        </div>
    );
};

export default Card;
