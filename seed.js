require('dotenv').config();

const mongoose = require('mongoose');

const User = require('./models/User');
const Group = require('./models/Group');
const Post = require('./models/Post');

const DEMO_EMAIL_SUFFIX = '@festival-demo.com';
const DEMO_PASSWORD = 'Festival123!';

async function connectDB()
{
  const mongoUri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI;

  if (!mongoUri)
  {
    throw new Error(
      'MongoDB connection string was not found in .env'
    );
  }

  await mongoose.connect(mongoUri);

  console.log('MongoDB connected');
}

async function removeOldDemoData()
{
  console.log(
    'Removing previous demo data...'
  );

  const oldDemoUsers =
    await User.find(
    {
      email:
      {
        $regex:
          '@festival-demo\\.com$',

        $options: 'i'
      }
    });

  const oldUserIds =
    oldDemoUsers.map(
      user => user._id
    );

  const oldDemoGroups =
    await Group.find(
    {
      creator:
      {
        $in: oldUserIds
      }
    });

  const oldGroupIds =
    oldDemoGroups.map(
      group => group._id
    );

  if (oldUserIds.length > 0)
  {
    await Post.deleteMany(
    {
      $or:
      [
        {
          author:
          {
            $in: oldUserIds
          }
        },

        {
          group:
          {
            $in: oldGroupIds
          }
        }
      ]
    });

    await Group.deleteMany(
    {
      _id:
      {
        $in: oldGroupIds
      }
    });

    await User.deleteMany(
    {
      _id:
      {
        $in: oldUserIds
      }
    });

    await User.updateMany(
      {},
      {
        $pull:
        {
          following:
          {
            $in: oldUserIds
          },

          groups:
          {
            $in: oldGroupIds
          }
        }
      }
    );

    await Post.updateMany(
      {},
      {
        $pull:
        {
          likedBy:
          {
            $in: oldUserIds
          }
        }
      }
    );
  }

  console.log(
    'Previous demo data removed'
  );
}

async function createUsers()
{
  console.log(
    'Creating demo users...'
  );

  const usersData =
  [
    {
      username: 'maya.festival',
      email: `maya${DEMO_EMAIL_SUFFIX}`,
      favoriteGenres: ['House', 'Techno']
    },
    {
      username: 'daniel.beats',
      email: `daniel${DEMO_EMAIL_SUFFIX}`,
      favoriteGenres: ['Techno', 'Trance']
    },
    {
      username: 'noa.raves',
      email: `noa${DEMO_EMAIL_SUFFIX}`,
      favoriteGenres: ['House', 'EDM']
    },
    {
      username: 'lior.music',
      email: `lior${DEMO_EMAIL_SUFFIX}`,
      favoriteGenres: ['Trance', 'EDM']
    },
    {
      username: 'shira.dance',
      email: `shira${DEMO_EMAIL_SUFFIX}`,
      favoriteGenres: ['House', 'Pop']
    },
    {
      username: 'omer.nights',
      email: `omer${DEMO_EMAIL_SUFFIX}`,
      favoriteGenres: ['Techno', 'House']
    },
    {
      username: 'roni.vibes',
      email: `roni${DEMO_EMAIL_SUFFIX}`,
      favoriteGenres: ['EDM', 'House']
    },
    {
      username: 'itai.raver',
      email: `itai${DEMO_EMAIL_SUFFIX}`,
      favoriteGenres: ['Trance', 'Techno']
    },
    {
      username: 'yael.sunset',
      email: `yael${DEMO_EMAIL_SUFFIX}`,
      favoriteGenres: ['House', 'Chill']
    },
    {
      username: 'amit.fest',
      email: `amit${DEMO_EMAIL_SUFFIX}`,
      favoriteGenres: ['EDM', 'Pop']
    },
    {
      username: 'gal.party',
      email: `gal${DEMO_EMAIL_SUFFIX}`,
      favoriteGenres: ['House', 'Techno']
    },
    {
      username: 'eden.music',
      email: `eden${DEMO_EMAIL_SUFFIX}`,
      favoriteGenres: ['Pop', 'EDM']
    },
    {
      username: 'tom.beats',
      email: `tom${DEMO_EMAIL_SUFFIX}`,
      favoriteGenres: ['Techno', 'Trance']
    },
    {
      username: 'noya.nights',
      email: `noya${DEMO_EMAIL_SUFFIX}`,
      favoriteGenres: ['House', 'EDM']
    },
    {
      username: 'yuval.rave',
      email: `yuval${DEMO_EMAIL_SUFFIX}`,
      favoriteGenres: ['Trance', 'House']
    }
  ];

  const users = [];

  for (const data of usersData)
  {
    const user =
      new User(
      {
        ...data,
        password: DEMO_PASSWORD
      });

    await user.save();

    users.push(user);
  }

  for (
    let i = 0;
    i < users.length;
    i++
  )
  {
    const following = [];

    for (
      let offset = 1;
      offset <= 4;
      offset++
    )
    {
      following.push(
        users[
          (i + offset) %
          users.length
        ]._id
      );
    }

    users[i].following =
      following;

    await users[i].save();
  }

  console.log(
    `${users.length} demo users created`
  );

  return users;
}

async function createGroups(users)
{
  console.log(
    'Creating demo groups...'
  );

  const groupsData =
  [
    {
      name: 'Tel Aviv House Lovers',
      description:
        'For house music lovers, parties and festival recommendations.',
      category: 'House'
    },
    {
      name: 'Techno After Dark',
      description:
        'Techno events, underground parties and late-night festival vibes.',
      category: 'Techno'
    },
    {
      name: 'Trance Israel',
      description:
        'A community for trance festivals, outdoor events and good energy.',
      category: 'Trance'
    },
    {
      name: 'Festival Travelers',
      description:
        'Find people to travel with to festivals around the world.',
      category: 'Travel'
    },
    {
      name: 'EDM Nation',
      description:
        'Big stages, EDM artists and festival news.',
      category: 'EDM'
    },
    {
      name: 'Sunset Parties',
      description:
        'Beach parties, sunsets and open-air music events.',
      category: 'House'
    },
    {
      name: 'Weekend Ravers',
      description:
        'Planning the next weekend and finding the best parties.',
      category: 'Party'
    },
    {
      name: 'Festival Friends',
      description:
        'Meet new people before festivals and never go alone.',
      category: 'Community'
    }
  ];

  const groups = [];

  for (
    let i = 0;
    i < groupsData.length;
    i++
  )
  {
    const creator = users[i];

    const memberIndexes =
    [
      i,
      (i + 1) % users.length,
      (i + 2) % users.length,
      (i + 3) % users.length,
      (i + 5) % users.length,
      (i + 7) % users.length
    ];

    const memberIds =
      [
        ...new Set(
          memberIndexes.map(
            index =>
              users[index]
                ._id
                .toString()
          )
        )
      ].map(
        id =>
          new mongoose.Types.ObjectId(
            id
          )
      );

    const group =
      await Group.create(
      {
        ...groupsData[i],

        creator:
          creator._id,

        members:
          memberIds,

        memberCount:
          memberIds.length
      });

    groups.push(group);

    for (
      const memberId
      of memberIds
    )
    {
      await User.updateOne(
        {
          _id: memberId
        },
        {
          $addToSet:
          {
            groups:
              group._id
          }
        }
      );
    }
  }

  console.log(
    `${groups.length} demo groups created`
  );

  return groups;
}

function getLocation(index)
{
  const locations =
  [
    [34.7818, 32.0853],
    [34.7748, 32.0636],
    [34.7683, 32.0705],
    [34.7950, 32.0809],
    [34.7503, 32.0504],
    [34.7742, 32.0967],
    [34.7697, 32.0809],
    [34.8000, 32.0700]
  ];

  return locations[
    index % locations.length
  ];
}

function getMediaUrl(index)
{
  const partyVideos =
  [
    '/videos/IMG_2150.MOV',
    '/videos/IMG_2356_small.mp4',
    '/videos/IMG_2421.MOV',
    '/videos/IMG_2543.MOV'
  ];

  const partyImages =
  [
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',

    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80',

    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',

    'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80'
  ];

  if (
    index === 0 ||
    index === 8 ||
    index === 16 ||
    index === 24
  )
  {
    const videoIndex =
      Math.floor(index / 8);

    return partyVideos[
      videoIndex %
      partyVideos.length
    ];
  }

  if (index % 4 === 0)
  {
    return partyImages[
      index %
      partyImages.length
    ];
  }

  return '';
}

async function createPosts(
  users,
  groups
)
{
  console.log(
    'Creating demo posts...'
  );

  const postIdeas =
  [
    ['Friday Night Plans', 'Who is going out this Friday? Looking for a good house party.', 'House'],
    ['Festival Season', 'Festival season is finally here. What event are you most excited for?', 'EDM'],
    ['Techno Tonight', 'Looking for a strong techno event tonight. Any recommendations?', 'Techno'],
    ['Sunset Session', 'Perfect weather for music by the beach before sunset.', 'House'],
    ['Trance Weekend', 'Anyone going to the outdoor trance event this weekend?', 'Trance'],
    ['Best Set Ever', 'Still thinking about the closing set from last night. Incredible energy.', 'House'],
    ['Looking for Festival Friends', 'My friends cannot make it this weekend. Anyone wants to join?', 'EDM'],
    ['Morning After', 'That was one of the best parties this month. Hope everyone got home safe.', 'Techno'],
    ['Beach Party', 'Music, sunset and friends. Exactly what we needed.', 'House'],
    ['Next Festival', 'Already planning the next festival trip. Give me your recommendations.', 'EDM'],
    ['Late Night Techno', 'The dance floor was still full at 5 AM. What a night.', 'Techno'],
    ['Outdoor Vibes', 'Nothing beats dancing outside under the stars.', 'Trance'],
    ['New Music', 'Found some amazing tracks today. Need to hear them on a big sound system.', 'House'],
    ['Weekend Loading', 'Who already has plans for the weekend?', 'EDM'],
    ['Festival Travel', 'Thinking about flying to a festival in Europe this year.', 'EDM'],
    ['Sunday Session', 'Sunday afternoon music is always a good idea.', 'House'],
    ['Rave Crew', 'Best part of every festival is meeting new people.', 'Techno'],
    ['Open Air', 'Looking for more open-air events before summer ends.', 'House'],
    ['Dance All Night', 'No better feeling than losing track of time on the dance floor.', 'EDM'],
    ['Trance Family', 'Amazing crowd and energy at the last outdoor event.', 'Trance'],
    ['Tonight in Tel Aviv', 'So many events tonight. Where is everyone going?', 'House'],
    ['After Party', 'Does anyone know a good after party for tonight?', 'Techno'],
    ['Festival Memories', 'Already missing the festival from last weekend.', 'EDM'],
    ['Sunset and Music', 'This city is at its best when the music starts before sunset.', 'House'],
    ['New Friends', 'Met such great people through the last event.', 'EDM'],
    ['Techno Crew', 'Looking for people who love darker techno sets.', 'Techno'],
    ['Weekend Trip', 'Thinking about combining a weekend trip with a festival.', 'EDM'],
    ['Outdoor Trance', 'The next outdoor trance event looks amazing.', 'Trance'],
    ['House Music All Day', 'House music and sunshine. Perfect combination.', 'House'],
    ['Party Recommendation', 'Drop your best party recommendation for this week.', 'EDM'],
    ['Night Vibes', 'Tel Aviv nights never disappoint.', 'House'],
    ['Festival Countdown', 'Only a few days left. Who else is counting?', 'EDM'],
    ['Good Energy', 'Great music, great crowd and exactly the energy we needed.', 'Trance'],
    ['Dance Floor', 'See you all on the dance floor tonight.', 'Techno'],
    ['One More Festival', 'I said the last one was my final festival this month. I lied.', 'House']
  ];

  const posts = [];

  for (
    let i = 0;
    i < postIdeas.length;
    i++
  )
  {
    const author =
      users[
        i % users.length
      ];

    const group =
      groups[
        i % groups.length
      ];

    const [
      title,
      postContent,
      genre
    ] = postIdeas[i];

    const post =
      new Post(
      {
        author:
          author._id,

        title,

        content:
          postContent,

        genre,

        mediaUrl:
          getMediaUrl(i),

        group:
          group._id,

        location:
        {
          type: 'Point',

          coordinates:
            getLocation(i)
        },

        isLive:
          i % 7 === 0
      });

    const likeCount =
      2 + (i % 6);

    for (
      let j = 1;
      j <= likeCount;
      j++
    )
    {
      const liker =
        users[
          (i + j) %
          users.length
        ];

      if (
        liker._id.toString() !==
        author._id.toString()
      )
      {
        post.likedBy.push(
          liker._id
        );
      }
    }

    const firstCommenter =
      users[
        (i + 3) %
        users.length
      ];

    const secondCommenter =
      users[
        (i + 6) %
        users.length
      ];

    post.comments.push(
    {
      author:
        firstCommenter._id,

      text:
        'This sounds amazing! 🔥'
    });

    if (i % 2 === 0)
    {
      post.comments.push(
      {
        author:
          secondCommenter._id,

        text:
          'I am definitely interested 🙌'
      });
    }

    await post.save();

    posts.push(post);
  }

  console.log(
    `${posts.length} demo posts created`
  );

  return posts;
}

async function seed()
{
  try
  {
    await connectDB();

    await removeOldDemoData();

    const users =
      await createUsers();

    const groups =
      await createGroups(users);

    const posts =
      await createPosts(
        users,
        groups
      );

    console.log('');
    console.log(
      '=============================='
    );
    console.log(
      'Festival Social seed complete!'
    );
    console.log(
      '=============================='
    );

    console.log(
      `Users: ${users.length}`
    );

    console.log(
      `Groups: ${groups.length}`
    );

    console.log(
      `Posts: ${posts.length}`
    );

    console.log('');

    console.log('Demo login:');

    console.log(
      `Username: ${users[0].username}`
    );

    console.log(
      `Email: maya${DEMO_EMAIL_SUFFIX}`
    );

    console.log(
      `Password: ${DEMO_PASSWORD}`
    );

    console.log(
      '=============================='
    );
  }
  catch (err)
  {
    console.error('');
    console.error(
      'Seed failed:'
    );

    console.error(err);

    process.exitCode = 1;
  }
  finally
  {
    await mongoose.disconnect();
  }
}

seed();