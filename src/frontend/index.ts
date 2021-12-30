import { quoteGet, quoteSet } from "../shared/api-paths";
import { Quote } from "../shared/quote";

const inputDate = document.getElementById("input-date") as HTMLInputElement;
const inputQuote = document.getElementById("input-quote") as HTMLInputElement;
const inputBtnGet = document.getElementById("input-btn-get") as HTMLInputElement;
const inputBtnSet = document.getElementById("input-btn-set") as HTMLInputElement;

inputBtnGet.onclick = async () => {
    const url = new URL('.' + quoteGet, window.location.origin);
    const response = await fetch(url.toString(), {
        method: 'POST',
        body: JSON.stringify({ date: inputDate.valueAsDate }),
        headers: { 'Content-Type': 'application/json' },
    });
    const quote: Quote = await response.json();
    inputDate.valueAsDate = new Date(quote.date);
    inputQuote.valueAsNumber = quote.value;
};
inputBtnSet.onclick = async () => {
    const url = new URL('.' + quoteSet, window.location.origin);
    const response = await fetch(url.toString(), {
        method: 'POST',
        body: JSON.stringify({ date: inputDate.valueAsDate, value: inputQuote.valueAsNumber }),
        headers: { 'Content-Type': 'application/json' },
    });
    const success: boolean = await response.json();
    if (!success) throw new Error("Failed setting quote");
};
