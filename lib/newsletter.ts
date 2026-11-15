// Weekly Chemistry Digest subscribers. Self-contained model on the shared Sequelize connection;
// the table is created on first use (idempotent), so no migration step is needed.
import { DataTypes, Model, type Optional } from "sequelize"
import { sequelize, ensureDbSynced } from "./db"

interface SubscriberAttributes {
  id: number
  email: string
  source: string
  createdAt?: Date
  updatedAt?: Date
}

export class NewsletterSubscriber
  extends Model<SubscriberAttributes, Optional<SubscriberAttributes, "id" | "source">>
  implements SubscriberAttributes
{
  declare public id: number
  declare public email: string
  declare public source: string
  declare public readonly createdAt: Date
  declare public readonly updatedAt: Date
}

if (!sequelize.models.NewsletterSubscriber) {
  NewsletterSubscriber.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      email: { type: DataTypes.STRING(255), allowNull: false, unique: "idx_unique_newsletter_email" },
      source: { type: DataTypes.STRING(40), allowNull: false, defaultValue: "news_page" },
    },
    { sequelize, modelName: "NewsletterSubscriber", tableName: "newsletter_subscribers", underscored: true, timestamps: true }
  )
}

let synced: Promise<unknown> | null = null

/** Returns true if the email was newly added, false if it was already subscribed. */
export async function addSubscriber(email: string, source = "news_page"): Promise<boolean> {
  await ensureDbSynced()
  synced ??= NewsletterSubscriber.sync().catch((err) => {
    synced = null
    throw err
  })
  await synced
  const [, created] = await NewsletterSubscriber.findOrCreate({ where: { email }, defaults: { email, source } })
  return created
}
