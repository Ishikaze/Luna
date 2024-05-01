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
lunaQueue = [];

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
  // if (
  //   msg.author.username !== "ishikaze" &&
  //   msg.author.username !== ".pikamee" &&
  //   msg.author.username !== "thecuddleslut"
  // ) {
  //   if (msg.content.toLowerCase().includes("luna") === true) {
  //     msg.react("❌");
  //   }
  //   return;
  // }

  if (msg.content.toLowerCase().includes("luna") === false) {
    console.log("ignored");
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
      console.log(`queued ${msg.author.username} ${msg.id} ${msg.channelId} ${msg.content}`)
      lunaQueue.push({
        username: msg.author.username,
        id: msg.id,
        chid: msg.channelId,
        gid: msg.guildId,
        content: msg.content,
      });
      return;
    }
    sendRequest(false);
    function sendRequest(loop) {
      let author = msg.author.username;
      let mesID = msg.id;
      let chID = msg.channelId;
      let gID = msg.guildId;
      let prompt = msg.content;

      if (loop == true) {
        let queueData = lunaQueue;
        //console.log(`looping ${JSON.stringify(queueData)}`);

        author = queueData[0].username;
        //console.log(`username ${author}`);

        mesID = queueData[0].id;
        //console.log(`mesID ${mesID}`);

        chID - queueData[0].chid;
        //console.log(`chID ${chID}`);

        gID - queueData[0].gid;

        prompt = queueData[0].content;
        //console.log(`prompt ${prompt}`);

        lunaQueue.shift()
      }

      console.log(`(${author} is talking) ${prompt}`);
      let channel = client.channels.cache.get(chID);
      setTimeout(() => {channel.sendTyping();}, 500)
      lunaPause = true;

      lunaHistory.push({
        role: "user",
        content: prompt,
        name: author,
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
        content: prompt,
        name: author,
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

          channel.messages.cache.get(mesID).reply(reply);

          console.log(`memory: ${lunaHistory.length}/10`);
          if (lunaHistory.length > 10) {
            lunaHistory.shift();
            lunaHistory.shift();
          }

          lunaPause = false;

          if (lunaQueue.length > 0) {
            sendRequest(true);
          }
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
  }
});

client.login(process.env.TOKEN);
