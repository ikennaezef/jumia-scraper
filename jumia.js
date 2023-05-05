const puppeteer = require("puppeteer");
const fs = require("fs");

const start = async () => {
	const browser = await puppeteer.launch({ headless: "new" });
	const page = await browser.newPage();

	await page.goto("https://www.jumia.com.ng/smartphones/", {
		waitUntil: "load",
	});

	let isDisabled = false;
	while (!isDisabled) {
		await page.waitForSelector(".prd");

		const data = await page.evaluate(() => {
			const allProducts_ = document.querySelectorAll(".prd");
			const arr = [];
			allProducts_.forEach((product) => {
				try {
					const name = product
						.querySelector("a.core .info .name")
						.innerText.replace(/,/g, "");
					const price = product
						.querySelector("a.core .info .prc")
						.innerText.replace(/,/g, "");

					const p = price.split(" ");

					const parsedPrice = parseInt(p[p.length - 1]);
					const image = product
						.querySelector("a.core .img")
						.getAttribute("data-src");

					const link = product.querySelector("a.core").getAttribute("href");
					const fullLink = `https://jumia.com.ng${link}`;

					if (parsedPrice < 70000 && parsedPrice > 60000) {
						arr.push({ name, price, link: fullLink, image });
					}
				} catch (error) {
					console.log("ERROR OCCURED", error);
				}
			});

			return arr;
		});

		data.forEach((prod) => {
			fs.appendFile(
				"data.csv",
				`${prod.name},${prod.price},${prod.link},${prod.image}\n`,
				function (err) {
					if (err) throw err;
				}
			);
		});

		// MOVING TO NEXT PAGE IF THERE IS ONE
		await page.waitForSelector("a.pg", { visible: true });
		const is_disabled = (await page.$("a.pg[aria-label='Next Page']")) == null;
		isDisabled = is_disabled;
		if (!is_disabled) {
			await Promise.all([
				page.click("a.pg[aria-label='Next Page']"),
				page.waitForNavigation({ waitUntil: "networkidle2" }),
			]);
		} else {
			console.log("IT IS FINISHEDDD");
		}
	}

	await browser.close();
};

start();
