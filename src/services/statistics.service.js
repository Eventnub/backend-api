const { getUsers } = require("./user.service");
const { getEvents } = require("./event.service");

const getBasicStatistics = async () => {
  const users = await getUsers();
  const events = await getEvents({ includeArchived: true });
  let artists = [];
  events.forEach((event) => {
    artists.push(...event.artists);
  });
  artists = [...new Set(artists)];

  const usersCount = users.length;
  const eventsCount = events.length;
  const artistsCount = artists.length;

  return { usersCount, eventsCount, artistsCount };
};

module.exports = {
  getBasicStatistics,
};
