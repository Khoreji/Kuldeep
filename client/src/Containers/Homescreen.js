import { useEffect, useState } from "react";
import Card from "../Components/Card";
import Navbar from "../Components/Navbar";
import socket from "../Extras/socket";

const Homescreen = () => {
    const [coins, setCoins] = useState([]);
    const [updated, setUpdated] = useState({});
    const [margins, setMargins] = useState(["NA", "NA"]);
    const [status, setStatus] = useState({});
    const [balance, setBalance] = useState({});
    const [usdtPrice, setUsdtPrice] = useState({});
    const [errors, setErrors] = useState({});

    const [search, setSearch] = useState("");

    useEffect(() => {
        socket.on("connect", () => {
            socket.on("coin-list", (data) => {
                setCoins(data);
            });
            socket.on("update-time", (data) => {
                setUpdated(data);
            });
            socket.on("margins", (data) => {
                setMargins(data);
            });
            socket.on("coin-status", (data) => {
                setStatus(data);
            });
            socket.on("balance", (data) => {
                setBalance(data);
            });
            socket.on("usdt-price", (data) => {
                setUsdtPrice(data);
            });
            socket.on("FE-error", (data) => {
                setErrors(data);
            })
        });
    }, []);
    function filterName(name) {
        if (search === "") {
            return true;
        }
        return name.includes(search);
    }
    return (
        <div>
            <div className="homescreen">
                <Navbar
                    balance={balance}
                    usdtPrice={usdtPrice}
                    margins={margins}
                    setSearch={setSearch}
                />
                <div className="d-flex">
                    <div className="homescreen-body">
                        {coins
                            .sort()
                            .filter(filterName)
                            .map((coin) => {
                                return (
                                    <Card
                                        coin={coin}
                                        status={`dot ${status[coin] || "inactive"}`}
                                        margins={[
                                            margins?.[coin]?.reverse ||
                                            margins["default"]?.reverse,
                                            margins?.[coin]?.straight ||
                                            margins["default"]?.straight,
                                        ]}
                                        updated={updated[coin] || ["NA", "NA"]}
                                    />
                                );
                            })}
                    </div>
                    <div className="notification-body">
                            {
                                Object.keys(errors).map((key) => {
                                    return <Notification head={errors[key].head} body={errors[key].body} />
                                })
                            }
                    </div>
                </div>
            </div>
        </div>
    );
};

const Notification = (props) => {
    const { head, body } = props;
    return (
        <div className="notification">
            <div className="notification-heading">
                {head}
            </div>
            <div className="notification-description">
                {body}
            </div>
        </div>
    );
}

export default Homescreen;

// Notification functionality
// 1. Notification will show the coin pair | the type of notification | the time of notification
// 2. Notification will show the description of the notification such as stucked ongoing trade because of low balance, etc.
// 3. Notification will reset after it's respective time is over.
// 4. Notifications cannot be deleted manually.
// 5. Notifications for action resolved will not be shown, deleted notifications will indicate that the action is resolved.
// 6. Notifications will not be shown for ongoing trades because they're notified in the card itself as yellow dot.
// 7. Margin change notification will be shown in the card itself.