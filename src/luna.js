require("dotenv").config();
const { Axios } = require("axios");
const {
  Client,
  IntentsBitField,
  managerToFetchingStrategyOptions,
} = require("discord.js");
const NLPCloudClient = require("nlpcloud");
const axios = require("axios");
let lunaHistory = [];
console.log(typeof lunaHistory);
lunaPause = false;

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

client.on("ready", (c) => {
  console.log(`${c.user.displayName} is up!`);
});

client.on("messageCreate", (msg) => {
  if (msg.author.bot) {
    //console.log('bot')
    return;
  }
  if (
    msg.author.username !== "ishikaze" &&
    msg.author.username !== ".pikamee" &&
    msg.author.username !== "thecuddleslut"
  ) {
    msg.react("❌");
    return;
  }
  if (msg.content.toLowerCase().includes("luna") === false) {
    //console.log('ignored')
    return;
  }
  if (msg.content.toLowerCase().includes("png")) {
    msg.channel.send(
      `latency ${
        Date.now() - msg.createdTimestamp
      }ms. api latency is ${Math.round(client.ws.ping)}ms`
    );
    return;
  }
  if (msg.content.toLowerCase().includes("shft")) {
    let shift = lunaHistory.shift();
    msg.channel.send(`shifted ${shift}`);
    return;
  }
  if (msg.content.toLowerCase().includes("hstry")) {
    msg.channel.send("```" + JSON.stringify(lunaHistory) + "```");
    return;
  } else {
    if (lunaPause === true) {
      msg.react("⌛");
      return;
    }
    console.log(`(${msg.author.username} is talking) ${msg.content}`);
    console.log(typeof lunaHistory);
    msg.channel.sendTyping();
    lunaPause = true;

    lunaHistory.push({
      role: "user",
      content: msg.content,
      name: msg.author.username,
    });

    let rqstMessages = [];
    rqstMessages.push({
      role: "system",
      content: process.env.botPrompt,
      name: "system",
    });

    if (lunaHistory.length > 0) {
      for (let h = 0; h < lunaHistory.length; h++) {
        rqstMessages.push(lunaHistory[h]);
        //console.log(`pushed ${JSON.stringify(lunaHistory[h])}`)
      }
    }

    rqstMessages.push({
      role: "user",
      content: msg.content,
      name: msg.author.username,
    });

    axios
      .post(
        process.env.local,
        {
          messages: rqstMessages,
          response_config: {
            role: "assistant",
          },
          model: "mytholite",
          max_tokens: 100,
          min_tokens: 10,
          temperature: 1,
          repetition_penalty: 1,
          presence_penalty: 0,
          frequency_penalty: 0,
          top_k: 0,
          epsilon_cutoff: 0,
          min_p: 0,
          top_a: 0,
          top_p: 1,
          typical_p: 1,
          eta_cutoff: 0,
          tfs: 1,
          mirostat_mode: 0,
          mirostat_tau: 0,
          mirostat_eta: 0,
          logit_bias: null,
          ignore_eos: false,
          stop: [],
          custom_token_bans: [],
          stream: false,
          timeout: null,
          allow_logging: null,
          logprobs: false,
          top_logprobs: null,
        },
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.localAuth}`,
          },
        }
      )
      .then(function (response) {
        console.log(response.data);

        let reply = response.data.choices[0].message.content;
        reply = reply.toLowerCase();
        reply = reply.replace("luna:", "");
        reply = reply.replace(":d", ":D");

        lunaHistory.push({
          role: "assistant",
          content: reply,
          name: "Luna",
        });

        //console.log(`pushed reply to memory: \n${JSON.stringify(lunaHistory)}`)

        msg.reply(reply);

        console.log(`memory: ${lunaHistory.length}/10`);
        if (lunaHistory.length > 10) {
          lunaHistory.shift();
          lunaHistory.shift();
        }

        lunaPause = false;
      })
      .catch(function (error) {
        console.log(error);
        console.log(JSON.stringify(error.data));

        lunaPause = false;
        msg.channel.send(
          `i just threw an error. please tell ishikaze to look at it.`
        );
      });
  }
});

client.login(process.env.TOKEN);
