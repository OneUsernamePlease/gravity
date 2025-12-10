type Lifetime = "singleton" | "transient";
type Token<T> = new (...args: any[]) => T;

interface Registration<T> {
    token: Token<T>;
    factory: (container: DIContainer) => T;
    lifetime: Lifetime;
}

export class DIContainer {
    private registrations: Map<any, Registration<any>> = new Map();
    private singletons: Map<any, any> = new Map();

    register<T>(
        token: Token<T>,
        factory: (c: DIContainer) => T,
        lifetime: Lifetime = "singleton",
    ) {
        this.registrations.set(token, { token, factory, lifetime });
    }

    resolve<T>(token: Token<T>): T {
        const registration = this.registrations.get(token);
        if (!registration) {
            throw new Error(`No provider registered for ${token.name}`);
            
        }

        if (registration.lifetime === "singleton") {
            if (!this.singletons.has(token)) {
                const instance = registration.factory(this);
                this.singletons.set(token, instance);
            }
            return this.singletons.get(token);
        } else {
            return registration.factory(this);
        }
    }
}
