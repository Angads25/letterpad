import * as GraphQLTools from "graphql-tools";
import Author from "./schema/author";
import Post from "./schema/post";
import PostTaxonomy from "./schema/postTaxonomy";
import Taxonomy from "./schema/taxonomy";
import TaxonomyInputType from "./schema/taxonomyInputType";
import FileInputType from "./schema/fileInputType";

import Sequalize from "sequelize";

import {
    createPost,
    updatePost,
    PostModel,
    AuthorModel,
    TaxonomyModel,
    PostTaxonomyModel,
    uploadFile
} from "./models";

function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}
/*  the GraphQL schema definition  */

let definition = `
    schema {
        query:    Query
        mutation: Mutation
    }
    type Query {
        post(id: Int, type: String, permalink: String): Post
        posts(type: String, body: String): [Post]
        authors(id: Int, username: String): [Author]
        taxonomies(type: String, name: String): [Taxonomy]
        postTaxonomies(type: String, name: String, postType: String): [PostTaxonomy]
    }
    type Mutation {
        createPost(id: Int, title: String, body: String, author: String, excerpt: String, cover_image: String, type:                String, status: String, permalink: String, taxonomies: [TaxonomyInputType]):Post
        updatePost(id: Int, title: String, body: String, author: String, excerpt: String, cover_image: String, type:                String, status: String, permalink: String, taxonomies: [TaxonomyInputType]):Post
        uploadFile(id: Int, cover_image: String):Post
    }
    
`;

/*  the GraphQL schema resolvers  */
let resolvers = {
    Mutation: {
        createPost: (root, args) => {
            let data = {};
            Object.keys(args).forEach(field => {
                data[field] = args[field];
            });
            return createPost(data);
        },
        updatePost: (root, args) => {
            let data = {};
            Object.keys(args).forEach(field => {
                data[field] = args[field];
            });
            return updatePost(data);
        },
        uploadFile: (root, args) => {
            return updatePost(args);
        }
    },
    Query: {
        posts: (root, args, context) => {
            let obj = {};
            for (let field in args) {
                obj[field] = IsJsonString(args[field])
                    ? JSON.parse(args[field])
                    : args[field];
            }
            return PostModel.findAll({ where: obj });
        },
        post: (root, args) => {
            return PostModel.findOne({ where: args });
        },
        authors: (root, args) => {
            return AuthorModel.findOne({ where: args });
        },
        taxonomies: (root, args) => {
            return TaxonomyModel.findAll({ where: args });
        },
        postTaxonomies: (root, args) => {
            let postType = args.postType;
            delete args.postType;
            return TaxonomyModel.findAll({
                attributes: ["name", "id", "type"],
                include: [
                    {
                        model: PostModel,
                        attributes: [
                            [
                                Sequalize.fn("COUNT", Sequalize.col("post.id")),
                                "post_count"
                            ]
                        ],
                        as: "post",
                        where: postType ? { type: postType } : {},
                        required: true
                    }
                ],
                where: args,
                group: ["taxonomy_id"]
            });
        }
    },
    Post: {
        author: post => {
            return post.getAuthor();
        },
        taxonomies: post => {
            return post.getTaxonomy();
        }
    },
    PostTaxonomy: {
        posts: (taxonomy, { type }) => {
            return taxonomy.getPost({ where: { type: type } });
        },
        post_count: taxonomy => {
            return taxonomy.post[0].dataValues.post_count;
        }
    }
};

/*  generate executable GraphQL schema  */
let schema = GraphQLTools.makeExecutableSchema({
    typeDefs: [
        definition,
        Author,
        Post,
        PostTaxonomy,
        Taxonomy,
        TaxonomyInputType
    ],
    resolvers: resolvers,
    allowUndefinedInResolve: false,
    printErrors: true,
    resolverValidationOptions: {
        requireResolversForArgs: true,
        requireResolversForNonScalar: false,
        requireResolversForAllFields: false
    }
});

export default schema;
