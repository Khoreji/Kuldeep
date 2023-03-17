import axios from "axios";

const Navbar = (props) => {
    // console.log(props.balance);

    let { balance, usdtPrice, margins, setSearch } = props;

    return (
        <nav className="navbar">
            <div className="nav-left">
                <div className="soft-name">DCX Automation</div>
            </div>
            <div className="nav-center">
                <div className="nav-center-item">
                    <input
                        type="text"
                        placeholder="Search"
                        className="search-bar"
                        onChange={(e) => {
                            setSearch(e.target.value.toUpperCase());
                        }}
                    />
                </div>
            </div>
            <div>
                <button className="btn btn-primary" onClick={
                    () => {
                        axios.get('http://13.235.65.255:3052/stop').then((res) => {

                        })
                    }
                }>Stop Automation</button>
            </div>
            <div className="nav-right">
                <div className="nav-right-item">
                    <div className="info-board">
                        <span className="bold">Balances</span> -{" "}
                        <span className="gray"> INR:</span>₹
                        {Number(balance?.["INR"]?.total).toFixed(2) || 0.0} |{" "}
                        <span className="gray"> USDT:</span> $
                        {Number(balance?.["USDT"]?.total).toFixed(2) || 0.0}
                    </div>
                    <div className="info-board">
                        <span className="bold">B/S Price :</span>{" "}
                        <span className="reverse">
                            {" "}
                            ₹{Number(usdtPrice?.buy).toFixed(2) || 0.0}{" "}
                        </span>{" "}
                        ,{" "}
                        <span className="straight">
                            {" "}
                            ₹{Number(usdtPrice?.sell).toFixed(2) || 0.0}
                        </span>{" "}
                        <span className="bold"> &nbsp; Margin : </span>{" "}
                        <span className="reverse">
                            {Number(margins?.["default"]?.reverse).toFixed(2) ||
                                0.0}
                            %
                        </span>{" "}
                        ,{" "}
                        <span className="straight">
                            {Number(margins?.["default"]?.straight).toFixed(
                                2
                            ) || 0.0}
                            %
                        </span>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
