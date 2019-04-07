CREATE TABLE if NOT EXISTS wifiologyUser(
  userID SERIAL NOT NULL PRIMARY KEY,
  emailAddress VARCHAR(256) UNIQUE NOT NULL,
  userName VARCHAR(256) UNIQUE NOT NULL,
  userData JSONB NOT NULL DEFAULT '{}',
  passwordData TEXT NOT NULL
);

CREATE TABLE if NOT EXISTS wifiologyNode(
  nodeID SERIAL NOT NULL PRIMARY KEY,
  nodeName VARCHAR(256) UNIQUE NOT NULL,
  nodeLastSeenTime TIMESTAMP WITH TIME ZONE NULL,
  nodeLocation TEXT NOT NULL,
  nodeDescription TEXT NOT NULL,
  ownerID INTEGER REFERENCES wifiologyUser(userID),
  nodeData JSONB NOT NULL DEFAULT '{}'
);
